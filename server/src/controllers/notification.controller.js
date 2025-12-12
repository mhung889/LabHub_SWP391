const Notification = require('../models/notification-model');
const Student = require('../models/student-model');
const ErrorResponse = require('../helpers/ErrorResponse');

// Mentor: create notification for a lab
exports.create = async (req, res) => {
  const { title, content, lab, isImportant } = req.body;

  if (!title || !content || !lab) {
    throw new ErrorResponse(400, 'Thiếu trường bắt buộc');
  }

  const notification = await Notification.create({
    title,
    content,
    lab,
    sender: req.user._id,
    isImportant: !!isImportant,
  });

  res.status(201).json({ success: true, notification });
};

// Mentor: list notifications (with optional search)
exports.list = async (req, res) => {
  const { search = '', lab } = req.query;
  const q = { status: 'active' };
  if (lab) q.lab = lab;
  if (search) q.$or = [
    { title: new RegExp(search, 'i') },
    { content: new RegExp(search, 'i') },
  ];

  const notifications = await Notification.find(q)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('sender', 'fullName email');

  res.json({ success: true, notifications });
};

// Student: get notifications for current student
exports.listForStudent = async (req, res) => {
  // find student's record to get lab id
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new ErrorResponse(404, 'Student not found');

  const { search = '' } = req.query;
  const q = { lab: student.lab, status: 'active' };
  if (search) q.$or = [
    { title: new RegExp(search, 'i') },
    { content: new RegExp(search, 'i') },
  ];

  const notifications = await Notification.find(q)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('sender', 'fullName email')
    .lean();

  // mark which are read
  const mapped = notifications.map((n) => {
    const isRead = (n.readBy || []).some((r) => String(r.student) === String(student._id));
    return { ...n, isRead };
  });

  // unread count
  const unreadCount = mapped.filter((m) => !m.isRead).length;

  res.json({ success: true, notifications: mapped, unreadCount });
};

// Student: mark single notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new ErrorResponse(404, 'Student not found');

  const notification = await Notification.findById(id);
  if (!notification) throw new ErrorResponse(404, 'Notification not found');

  const already = (notification.readBy || []).some((r) => String(r.student) === String(student._id));
  if (!already) {
    notification.readBy.push({ student: student._id, readAt: new Date() });
    await notification.save();
  }

  res.json({ success: true, notification });
};

// Mentor: update
exports.update = async (req, res) => {
  const { id } = req.params;
  const { title, content, isImportant, status } = req.body;

  const notification = await Notification.findById(id);
  if (!notification) throw new ErrorResponse(404, 'Notification not found');

  if (title !== undefined) notification.title = title;
  if (content !== undefined) notification.content = content;
  if (isImportant !== undefined) notification.isImportant = isImportant;
  if (status !== undefined) notification.status = status;

  await notification.save();

  res.json({ success: true, notification });
};

// Mentor: delete
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ErrorResponse(400, 'Invalid notification id');
    }

    const notification = await Notification.findById(id);
    if (!notification) throw new ErrorResponse(404, 'Notification not found');

    await notification.deleteOne();

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting notification:', err);
    if (err instanceof ErrorResponse) throw err;
    throw new ErrorResponse(500, err.message || 'Could not delete notification');
  }
};
