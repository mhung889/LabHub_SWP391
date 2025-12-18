const mongoose = require('mongoose');
const LeaveRequestModel = require('../models/leave-request-model');
const ErrorResponse = require('../helpers/ErrorResponse');
const StudentModel = require('../models/student-model');
const LabModel = require('../models/lab-model');
const UserModel = require('../models/user-model');

//POST
exports.createLeaveRequest = async (req, res) => {
  try {
    const { lab, leaveType, startDate, endDate, reason } = req.body;
    //console.log(req.user);
    const userId = req.user?._id; // lấy từ token
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại',
      });
    }

    // tìm student theo userId
    const studentByUser = await StudentModel.findOne({ user: userId });
    if (!studentByUser) {
      return res.status(404).json({
        message: 'Sinh viên không tồn tại',
      });
    }

    const studentId = studentByUser._id;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Thiếu thông tin bắt buộc',
      });
    }

    if (!studentByUser.lab) {
      return res.status(403).json({
        message: 'Bạn chưa được phân vào lab nên không thể xin nghỉ',
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: 'Phải có lí do để xin nghỉ',
      });
    }

    const labExist = await LabModel.findById(lab);
    if (!labExist) {
      return res.status(404).json({
        message: 'Lab không tồn tại',
      });
    }

    if (studentByUser.lab?.toString() !== lab.toString()) {
      return res.status(403).json({
        message: 'Bạn không thuộc lab này',
      });
    }

    // check  date
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Ngày không hợp lệ' });
    }

    if (start > end) {
      return res.status(400).json({
        message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc',
      });
    }

    // chuẩn hóa giờ tránh lệch timezone
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // totalDays
    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // xin nghỉ trước  x giờ
    // edit here
    const NOTICE_HOURS_BY_TYPE = {
      personal: 0,
      schoolActivity: 0,
      sick: 0,
    };

    const minNoticeHours = NOTICE_HOURS_BY_TYPE[leaveType] ?? 24;

    const now = new Date();
    const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < minNoticeHours) {
      return res.status(400).json({
        message: `Bạn phải xin nghỉ trước ít nhất ${minNoticeHours} giờ`,
      });
    }

    // mỗi tháng tối đa 4 ngày (tính theo tháng của startDate)
    // Nếu đơn kéo qua 2 tháng, cách này sẽ tính hết vào tháng startDate.
    const MAX_LEAVE_DAYS_PER_MONTH = 4;

    const monthStart = new Date(
      start.getFullYear(),
      start.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const monthEnd = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const usedInMonthAgg = await LeaveRequestModel.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          status: { $in: ['approved', 'pending'] },
          startDate: { $lte: monthEnd },
          endDate: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalDays' } } },
    ]);

    const usedInMonth = usedInMonthAgg?.[0]?.total || 0;

    if (usedInMonth + totalDays > MAX_LEAVE_DAYS_PER_MONTH) {
      return res.status(400).json({
        message: `Mỗi tháng chỉ được nghỉ tối đa ${MAX_LEAVE_DAYS_PER_MONTH} ngày (tháng này bạn đã dùng ${usedInMonth} ngày)`,
      });
    }

    // Check trùng thời gian (pending/approved)
    const existLeave = await LeaveRequestModel.findOne({
      student: studentId,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (existLeave) {
      return res.status(400).json({
        message: 'Bạn đã có đơn xin nghỉ trùng thời gian này',
      });
    }

    // Create leave request
    const leaveRequest = await LeaveRequestModel.create({
      student: studentId,
      lab,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason.trim(),
      status: 'pending',
    });

    return res.status(201).json({
      leaveRequest,
      message: 'Tạo đơn xin nghỉ thành công',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

//PATCH  /:id/cancel
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params; // leaveRequestId
    const userId = req.user?._id; // lấy từ token

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const student = await StudentModel.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ message: 'Sinh viên không tồn tại' });
    }

    const leaveRequest = await LeaveRequestModel.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Đơn xin nghỉ không tồn tại' });
    }

    if (leaveRequest.student.toString() !== student._id.toString()) {
      return res.status(403).json({
        message: 'Bạn không có quyền hủy đơn này',
      });
    }

    if (leaveRequest.status === 'approved') {
      return res.status(400).json({
        message: 'Không thể hủy đơn khi đã được duyệt',
      });
    }

    if (['rejected', 'cancelled'].includes(leaveRequest.status)) {
      return res.status(400).json({
        message: `Không thể hủy đơn ở trạng thái ${leaveRequest.status}`,
      });
    }

    leaveRequest.status = 'cancelled';
    await leaveRequest.save();

    return res.status(200).json({
      message: 'Hủy đơn xin nghỉ thành công',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

//GET
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const mentorId = req.user;
    if (!mentorId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const lab = await LabModel.findOne({ mentor: mentorId }).select('_id');

    if (!lab) {
      return res.status(200).json({
        leaveRequests: [],
        message: 'Mentor quản lý lớp lab nào',
      });
    }

    const labIds = lab._id;

    const leaveRequests = await LeaveRequestModel.find({
      lab: { $in: labIds },
    })
      .populate({
        path: 'student',
        select: 'studentCode user lab -_id',
        populate: {
          path: 'user',
          select: 'fullName email -_id',
        },
      })
      .populate('lab', 'name ')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      leaveRequests,
    });

    // return res.status(200).json(req.user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// GET /leave-requests/mine  (student)
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const userId = req.user?._id; // lấy từ token
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const student = await StudentModel.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ message: 'Sinh viên không tồn tại' });
    }

    const leaveRequests = await LeaveRequestModel.find({ student: student._id })
      .populate('lab', 'name')
      .populate({
        path: 'approver',
        select: 'fullName email',
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ leaveRequests });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// GET /:id/
exports.getLeaveRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveRequest = await LeaveRequestModel.findById(id)
      .populate({
        path: 'student',
        select: 'studentCode user lab ',
        populate: {
          path: 'user',
          select: 'fullName email ',
        },
      })
      .populate('lab', 'name ')
      .populate('approver', '');

    if (!leaveRequest) {
      return res.status(404).json({
        message: 'Đơn xin nghỉ không tồn tại',
      });
    }

    return res.status(200).json(leaveRequest);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// PATCH /:id/approve
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user?._id; //mentorId

    if (!approverId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const leaveRequest = await LeaveRequestModel.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        message: 'Đơn xin nghỉ không tồn tại',
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        message: `Không thể duyệt đơn`,
      });
    }

    leaveRequest.status = 'approved';
    leaveRequest.approver = approverId;
    leaveRequest.approvedAt = new Date();

    await leaveRequest.save();

    return res.status(200).json({
      message: 'Duyệt đơn xin nghỉ thành công',
      data: leaveRequest,
    });
  } catch (err) {
    console.error('Approve leave request error:', err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// PATCH   /:id/reject
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { note } = req.body;
    const { id } = req.params;
    const approverId = req.user?._id; //mentorId

    if (!approverId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({
        message: 'Bắt buộc nhập lý do từ chối',
      });
    }

    const leaveRequest = await LeaveRequestModel.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        message: 'Đơn xin nghỉ không tồn tại',
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        message: `Chỉ có thể từ chối đơn đang chờ duyệt`,
      });
    }

    leaveRequest.status = 'rejected';
    leaveRequest.approver = approverId;
    leaveRequest.approvedAt = new Date();
    leaveRequest.note = note.trim();

    await leaveRequest.save();

    return res.status(200).json({
      message: 'Từ chối đơn xin nghỉ thành công',
      data: leaveRequest,
    });
  } catch (err) {
    console.error('Reject leave request error:', err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
