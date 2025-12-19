const Evaluation = require('../models/evaluation-model');
const Student = require('../models/student-model');
const LabAttendance = require('../models/lab-attendance-model');
const Lab = require('../models/lab-model');
const mongoose = require('mongoose');

/**
 * @desc    Lấy danh sách sinh viên của Lab do Mentor quản lý (Tự động nhận diện Lab)
 * @route   GET /api/evaluation/lab/students
 */
exports.getStudentsByLab = async (req, res) => {
    try {
        const mentorId = req.user._id;

        const lab = await Lab.findOne({ mentor: mentorId });
        if (!lab) {
            return res.status(404).json({ message: "Tài khoản Mentor chưa được gán quản lý Lab nào." });
        }

        const students = await Student.find({ lab: lab._id })
            .populate('user', 'fullName email image')
            .populate('major', 'name');

        const evaluatedStudents = await Evaluation.find({ lab: lab._id }).select('student');
        const evaluatedIds = evaluatedStudents.map(e => e.student.toString());

        const result = students.map(student => ({
            ...student._doc,
            labId: lab._id,
            isEvaluated: evaluatedIds.includes(student._id.toString())
        }));

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Lấy thống kê chuyên cần và tính điểm đề xuất
 * @route   GET /api/evaluation/preview/:labId/:studentId
 */
exports.getEvaluationPreview = async (req, res) => {
  try {
      const { labId, studentId } = req.params;

      const query = {
          lab: new mongoose.Types.ObjectId(labId),
          student: new mongoose.Types.ObjectId(studentId)
      };

      // 1. Lấy thống kê chuyên cần
      const attendances = await LabAttendance.find(query);
      const stats = {
          absent: attendances.filter(a => String(a.status).trim() === 'absent').length,
          leave: attendances.filter(a => String(a.status).trim() === 'leave').length,
          partial: attendances.filter(a => String(a.status).trim() === 'partial').length,
      };

      // 2. Tính điểm đề xuất
      const penalty = (stats.absent * 1.5) + (stats.partial * 0.5) + (stats.leave * 0.2);
      const suggestedScore = Math.max(0, 10 - penalty).toFixed(1);

      // 3. TÌM ĐÁNH GIÁ ĐÃ TỒN TẠI (PHẦN MỚI THÊM)
      const existingEvaluation = await Evaluation.findOne(query);

      res.status(200).json({
          success: true,
          data: {
              stats,
              suggestedScore: parseFloat(suggestedScore),
              existingEvaluation, // Trả về để Frontend hiển thị lại
              recommendation: `Dựa trên thống kê (Vắng: ${stats.absent}, Muộn/Quên: ${stats.partial}, Phép: ${stats.leave}), điểm đề xuất là: ${suggestedScore}`
          }
      });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Lưu đánh giá mới
 * @route   POST /api/evaluation
 */
exports.createEvaluation = async (req, res) => {
    try {
        const { studentId, labId, finalScore, content, stats, suggestedScore } = req.body;
        const mentorId = req.user._id;

        const existingEval = await Evaluation.findOne({ student: studentId, lab: labId });
        if (existingEval) {
            return res.status(400).json({ message: "Sinh viên này đã được đánh giá trong Lab này." });
        }

        const newEvaluation = new Evaluation({
            mentor: mentorId,
            student: studentId,
            lab: labId,
            attendanceSnapshot: {
                absentCount: stats.absent,
                leaveCount: stats.leave,
                partialCount: stats.partial
            },
            suggestedScore,
            finalScore,
            content
        });

        await newEvaluation.save();

        res.status(201).json({
            success: true,
            message: "Lưu đánh giá thành công!",
            data: newEvaluation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Admin lấy toàn bộ danh sách đánh giá (có thể lọc theo labId)
 * @route   GET /api/evaluation/admin/list
 */
exports.getAdminEvaluations = async (req, res) => {
    try {
        const { labId } = req.query;
        let query = {};

        if (labId && labId !== 'all') {
            query.lab = labId;
        }

        const evaluations = await Evaluation.find(query)
            .populate({
                path: 'student',
                populate: { path: 'user', select: 'fullName studentCode image' }
            })
            .populate('lab', 'name')
            .populate('mentor', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: evaluations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Admin xem toàn bộ đánh giá của một Lab cụ thể (Dùng cho URL Params)
 * @route   GET /api/evaluation/admin/lab/:labId
 */
exports.getAllEvaluationsByLab = async (req, res) => {
    try {
        const { labId } = req.params;

        const evaluations = await Evaluation.find({ lab: labId })
            .populate({
                path: 'student',
                populate: { path: 'user', select: 'fullName studentCode image' }
            })
            .populate('mentor', 'fullName email')
            .populate('lab', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: evaluations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};