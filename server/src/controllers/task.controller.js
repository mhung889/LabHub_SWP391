const TaskModel = require('../models/task-model');
const TaskAssignmentModel = require('../models/task-assignment-model');
const StudentModel = require('../models/student-model');
const UserModel = require('../models/user-model');
const ErrorResponse = require('../helpers/ErrorResponse');

exports.getTasks = async (req, res) => {
  try {
    const mentorId = req.user._id;
    
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem danh sách task');
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20;
    const skip = (pageNum - 1) * limitNum;

    const tasks = await TaskModel.find({ createdBy: mentorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const tasksWithCounts = await Promise.all(
      tasks.map(async (task) => {
        const assignedCount = await TaskAssignmentModel.countDocuments({ task: task._id });
        return {
          ...task,
          assignedStudentsCount: assignedCount,
        };
      })
    );

    const total = await TaskModel.countDocuments({ createdBy: mentorId });

    return res.status(200).json({
      tasks: tasksWithCounts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getTasks:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách task');
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;

    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem task');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    const task = await TaskModel.findById(id).lean();

    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    if (task.createdBy.toString() !== mentorId.toString()) {
      throw new ErrorResponse(403, 'Bạn không có quyền xem task này');
    }

    const assignments = await TaskAssignmentModel.find({ task: id })
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'fullName email',
        },
      })
      .lean();

    const assignedStudents = assignments.map((assignment) => ({
      studentId: assignment.student._id,
      fullName: assignment.student.user?.fullName || 'N/A',
      email: assignment.student.user?.email || 'N/A',
      progress: assignment.progressStatus,
      submissionStatus: assignment.submissionFile ? 'submitted' : 'notSubmitted',
      progressNote: assignment.progressNote,
      submittedAt: assignment.submittedAt,
    }));

    return res.status(200).json({
      ...task,
      assignedStudents,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getTaskById:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy thông tin task');
  }
};

exports.createTask = async (req, res) => {
  try {
    const mentorId = req.user._id;

    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền tạo task');
    }

    const { taskTitle, description, startDate, dueDate, priority } = req.body;

    if (!taskTitle || !taskTitle.trim()) {
      throw new ErrorResponse(400, 'Tiêu đề task là bắt buộc');
    }

    if (taskTitle.trim().length > 200) {
      throw new ErrorResponse(400, 'Tiêu đề task không được vượt quá 200 ký tự');
    }

    if (!startDate) {
      throw new ErrorResponse(400, 'Ngày bắt đầu là bắt buộc');
    }

    if (!dueDate) {
      throw new ErrorResponse(400, 'Ngày hết hạn là bắt buộc');
    }

    const start = new Date(startDate);
    const due = new Date(dueDate);

    if (isNaN(start.getTime())) {
      throw new ErrorResponse(400, 'Ngày bắt đầu không hợp lệ');
    }

    if (isNaN(due.getTime())) {
      throw new ErrorResponse(400, 'Ngày hết hạn không hợp lệ');
    }

    if (start > due) {
      throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      throw new ErrorResponse(400, 'Độ ưu tiên không hợp lệ');
    }

    const task = await TaskModel.create({
      taskTitle: taskTitle.trim(),
      description: description?.trim() || '',
      startDate: start,
      dueDate: due,
      priority: priority || 'medium',
      status: 'active',
      createdBy: mentorId,
    });

    return res.status(201).json({
      message: 'Tạo task thành công',
      task,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in createTask:', error);
    throw new ErrorResponse(500, 'Lỗi khi tạo task');
  }
};

exports.assignTask = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;
    const { studentIds } = req.body;

    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền gán task');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new ErrorResponse(400, 'Danh sách student là bắt buộc');
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    if (task.createdBy.toString() !== mentorId.toString()) {
      throw new ErrorResponse(403, 'Bạn không có quyền gán task này');
    }

    const lab = await require('../models/lab-model').findOne({ mentor: mentorId, status: 'active' });
    
    if (!lab) {
      throw new ErrorResponse(404, 'Mentor chưa được gán lab');
    }

    const students = await StudentModel.find({
      _id: { $in: studentIds },
      lab: lab._id,
    });

    if (students.length !== studentIds.length) {
      throw new ErrorResponse(400, 'Một số student không hợp lệ hoặc không thuộc lab của mentor');
    }

    const assignments = [];
    const skipped = [];

    for (const studentId of studentIds) {
      const existing = await TaskAssignmentModel.findOne({
        task: id,
        student: studentId,
      });

      if (existing) {
        skipped.push(studentId);
        continue;
      }

      const assignment = await TaskAssignmentModel.create({
        task: id,
        student: studentId,
        progressStatus: 'notStarted',
      });

      assignments.push(assignment);
    }

    return res.status(200).json({
      message: `Gán task thành công cho ${assignments.length} student(s)`,
      assigned: assignments.length,
      skipped: skipped.length,
      assignments,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in assignTask:', error);
    throw new ErrorResponse(500, 'Lỗi khi gán task');
  }
};

exports.updateTask = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;
    const { taskTitle, description, startDate, dueDate, priority, status } = req.body;

    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền cập nhật task');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    if (task.createdBy.toString() !== mentorId.toString()) {
      throw new ErrorResponse(403, 'Bạn không có quyền cập nhật task này');
    }

    const updateData = {};

    if (taskTitle !== undefined) {
      if (!taskTitle || !taskTitle.trim()) {
        throw new ErrorResponse(400, 'Tiêu đề task là bắt buộc');
      }
      if (taskTitle.trim().length > 200) {
        throw new ErrorResponse(400, 'Tiêu đề task không được vượt quá 200 ký tự');
      }
      updateData.taskTitle = taskTitle.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    if (startDate !== undefined) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new ErrorResponse(400, 'Ngày bắt đầu không hợp lệ');
      }
      updateData.startDate = start;
    }

    if (dueDate !== undefined) {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) {
        throw new ErrorResponse(400, 'Ngày hết hạn không hợp lệ');
      }
      updateData.dueDate = due;
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        throw new ErrorResponse(400, 'Độ ưu tiên không hợp lệ');
      }
      updateData.priority = priority;
    }

    if (status !== undefined) {
      if (!['active', 'closed'].includes(status)) {
        throw new ErrorResponse(400, 'Trạng thái không hợp lệ');
      }
      updateData.status = status;
    }

    if (updateData.startDate && updateData.dueDate) {
      if (updateData.startDate > updateData.dueDate) {
        throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
      }
    } else if (updateData.startDate && task.dueDate) {
      if (updateData.startDate > task.dueDate) {
        throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
      }
    } else if (task.startDate && updateData.dueDate) {
      if (task.startDate > updateData.dueDate) {
        throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
      }
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return res.status(200).json({
      message: 'Cập nhật task thành công',
      task: updatedTask,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in updateTask:', error);
    throw new ErrorResponse(500, 'Lỗi khi cập nhật task');
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;

    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xóa task');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    if (task.createdBy.toString() !== mentorId.toString()) {
      throw new ErrorResponse(403, 'Bạn không có quyền xóa task này');
    }

    await TaskAssignmentModel.deleteMany({ task: id });
    await TaskModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Xóa task thành công',
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in deleteTask:', error);
    throw new ErrorResponse(500, 'Lỗi khi xóa task');
  }
};

exports.getAssignedStudents = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;

    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem danh sách student');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    if (task.createdBy.toString() !== mentorId.toString()) {
      throw new ErrorResponse(403, 'Bạn không có quyền xem task này');
    }

    const lab = await require('../models/lab-model').findOne({ mentor: mentorId, status: 'active' });
    
    if (!lab) {
      throw new ErrorResponse(404, 'Mentor chưa được gán lab');
    }

    const students = await StudentModel.find({ lab: lab._id })
      .populate('user', 'fullName email')
      .lean();

    const assignedStudentIds = await TaskAssignmentModel.find({ task: id })
      .distinct('student');

    const studentsList = students.map((student) => ({
      _id: student._id,
      fullName: student.user?.fullName || 'N/A',
      email: student.user?.email || 'N/A',
      isAssigned: assignedStudentIds.some(
        (id) => id.toString() === student._id.toString()
      ),
    }));

    return res.status(200).json({
      students: studentsList,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getAssignedStudents:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách student');
  }
};

