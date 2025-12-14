const mongoose = require('mongoose');
const LabModel = require('../models/lab-model');
const StudentModel = require('../models/student-model');
const MajorModel = require('../models/major-model');
const ErrorResponse = require('../helpers/ErrorResponse');

function generateLabCode(name) {
  if (!name) return null;

  const prefix = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0].toUpperCase())
    .join('');

  const random = Math.floor(100 + Math.random() * 900);

  return `${prefix}-${random}`;
}
exports.getLabs = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && (status === 'active' || status === 'inactive')) {
      query.status = status;
    }

    const labs = await LabModel.find(query)
      .select('name code description major status mentor')
      .populate('mentor', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      labs: labs || [],
    });
  } catch (error) {
    console.error('Error in getLabs:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách lab');
  }
};

exports.createLab = async (req, res) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      total,
      status,
      major,
      mentor,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Name is required',
      });
    }

    let code = generateLabCode(name);

    let existed = await LabModel.findOne({ code });
    while (existed) {
      code = generateLabCode(name);
      existed = await LabModel.findOne({ code });
    }

    const payload = {
      name: name.trim(),
      code,
      description,
      startTime,
      endTime,
      total,
      status,
    };

    if (major) {
      payload.major = major;
    }

    if (mentor) {
      payload.mentor = mentor;
    }

    const newLab = await LabModel.create(payload);

    return res.status(201).json({
      data: newLab,
      message: 'Tạo lab thành công',
    });
  } catch (error) {
    console.error('Create lab error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

exports.editLab = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      startTime,
      endTime,
      total,
      status,
      major,
      mentor,
      // code,
    } = req.body;

    const lab = await LabModel.findById(id);
    if (!lab) {
      return res.status(404).json({
        message: 'Lab không tồn tại',
      });
    }

    if (name !== undefined) lab.name = name;
    if (description !== undefined) lab.description = description;
    if (startTime !== undefined) lab.startTime = startTime;
    if (endTime !== undefined) lab.endTime = endTime;
    if (total !== undefined) lab.total = total;
    if (status !== undefined) lab.status = status;

    if (major !== undefined) {
      if (major === '' || major === null) {
        lab.major = null;
      } else {
        lab.major = major;
      }
    }

    if (mentor !== undefined) {
      if (mentor === '' || mentor === null) {
        lab.mentor = null;
      } else {
        lab.mentor = mentor;
      }
    }

    // if (code !== undefined) {
    //   const existed = await Lab.findOne({ code, _id: { $ne: id } });
    //   if (existed) {
    //     return res.status(400).json({ message: 'Lab code đã tồn tại' });
    //   }
    //   lab.code = code;
    // }

    const updatedLab = await lab.save();

    return res.status(200).json({
      data: updatedLab,
      message: 'Cập nhật lab thành công',
    });
  } catch (error) {
    console.error('Edit lab error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

exports.deleteLabById = async (req, res) => {
  try {
    const { id } = req.params;

    const lab = await LabModel.findById(id);
    if (!lab) {
      return res.status(404).json({
        message: 'Lab không tồn tại',
      });
    }

    const studentCount = await StudentModel.countDocuments({ lab: id });
    if (studentCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa lab vì còn ${studentCount} sinh viên đang thuộc lab này.`,
      });
    }

    if (lab.mentor) {
      return res.status(400).json({
        message: 'Không thể xóa lab vì vẫn còn mentor đang phụ trách.',
      });
    }

    const deletedLab = await LabModel.findByIdAndDelete(id);

    return res.status(200).json({
      data: deletedLab,
      message: 'Xóa lab thành công',
    });
  } catch (error) {
    console.error('Delete lab error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

exports.addStudentToLabById = async (req, res) => {
  try {
    const { id } = req.params; //labId
    const { studentId } = req.body;

    const lab = await LabModel.findById(id);
    if (!lab) return res.status(404).json({ message: 'Lab không tồn tại' });

    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student không tồn tại' });
    }

    if (
      lab.major &&
      student.major &&
      lab.major.toString() !== student.major.toString()
    ) {
      return res.status(400).json({
        message: 'Major student không khớp với major lab',
      });
    }

    const count = await StudentModel.countDocuments({ lab: id });
    if (count >= lab.total) {
      return res.status(400).json({ message: 'Lab đã đủ số lượng' });
    }

    if (student.lab) {
      return res.status(400).json({ message: 'Student đã có lab khác' });
    }

    student.lab = id;
    await student.save();

    return res.status(200).json({
      data: student,
      message: 'Thêm student vào lab thành công',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStudentsByLabId = async (req, res) => {
  try {
    const { id } = req.params;

    const lab = await LabModel.findOne({ _id: id });

    if (!lab) {
      return res.status(404).json({
        message: 'Lab không tồn tại',
      });
    }
    const students = await StudentModel.find({ lab: id })
      .populate('user', '')
      .populate('major', 'name code -_id')
      .populate('lab', '');

    const availableFilter = { lab: null };
    const availableStudents = await StudentModel.find(availableFilter)
      .populate('user', '')
      .populate('major', 'name code -_id');

    return res.status(200).json({
      students,
      availableStudents,
    });
  } catch (error) {
    console.error('Delete lab error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

exports.removeStudentFromLab = async (req, res) => {
  try {
    const { id } = req.params; //labId
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: 'studentId là bắt buộc',
      });
    }

    const lab = await LabModel.findOne({ _id: id });

    if (!lab) {
      return res.status(404).json({
        message: 'Lab không tồn tại',
      });
    }

    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: 'Student không tồn tại',
      });
    }

    if (!student.lab || student.lab.toString() !== id.toString()) {
      return res.status(400).json({
        message: 'Student không thuộc lab này',
      });
    }

    student.lab = null;
    await student.save();

    return res.status(200).json({
      data: student,
      message: 'Xóa student khỏi lab thành công',
    });
  } catch (error) {
    console.error('Delete lab error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

exports.getLabById = async (req, res) => {
  try {
    const { id } = req.params;

    const lab = await LabModel.findOne({ _id: id });

    if (!lab) {
      return res.status(404).json({
        message: 'Lab không tồn tại',
      });
    }

    return res.status(200).json(lab);
  } catch (error) {
    console.error('Delete lab error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

exports.getLabAll = async (req, res) => {
  try {
    let { page = 1, limit = 3, search = '', major } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 3;

    const filter = {};

    if (major && mongoose.Types.ObjectId.isValid(major)) {
      filter.major = major;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    const skip = (page - 1) * limit;

    const [labs, total] = await Promise.all([
      LabModel.find(filter)
        .populate('major', 'code name')
        .populate('enrolled')
        .populate('mentor', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LabModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      data: labs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get labs error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// =====================================
// UPDATE ATTENDANCE RULE
// =====================================
exports.updateAttendanceRule = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      checkInEarlyMinutes,
      checkInLateMinutes,
      checkOutEarlyMinutes,
      checkOutLateMinutes,
    } = req.body;

    const lab = await LabModel.findById(id);
    if (!lab) {
      return res.status(404).json({
        message: "Lab không tồn tại",
      });
    }

    // ===== Validate input (basic) =====
    const values = [
      checkInEarlyMinutes,
      checkInLateMinutes,
      checkOutEarlyMinutes,
      checkOutLateMinutes,
    ];

    if (values.some(v => v === undefined)) {
      return res.status(400).json({
        message: "Thiếu thông tin cấu hình thời gian điểm danh",
      });
    }

    if (values.some(v => typeof v !== "number" || v < 0)) {
      return res.status(400).json({
        message: "Thời gian cấu hình phải là số >= 0",
      });
    }

    // ===== Update rule =====
    lab.attendanceRule = {
      checkInEarlyMinutes,
      checkInLateMinutes,
      checkOutEarlyMinutes,
      checkOutLateMinutes,
    };

    await lab.save();

    return res.status(200).json({
      message: "Cập nhật cấu hình điểm danh thành công",
      attendanceRule: lab.attendanceRule,
    });
  } catch (error) {
    console.error("Update attendance rule error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

