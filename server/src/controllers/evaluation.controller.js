const EvaluationCriteriaModel = require('../models/evaluation-criteria-model');
const EvaluationModel = require('../models/evaluation-model');
const StudentModel = require('../models/student-model');
const UserModel = require('../models/user-model');
const LabModel = require('../models/lab-model');
const ErrorResponse = require('../helpers/ErrorResponse');

// UC-50: Configure Evaluation Criteria (OJT)
exports.getEvaluationCriterias = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ErrorResponse(403, 'Chỉ admin mới có quyền xem tiêu chí đánh giá');
    }

    const { includeInactive = false } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };

    const criterias = await EvaluationCriteriaModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      criterias,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getEvaluationCriterias:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách tiêu chí đánh giá');
  }
};

exports.createEvaluationCriteria = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ErrorResponse(403, 'Chỉ admin mới có quyền tạo tiêu chí đánh giá');
    }

    const { criterionName, description, weight, maxScore } = req.body;

    if (!criterionName || !criterionName.trim()) {
      throw new ErrorResponse(400, 'Tên tiêu chí là bắt buộc');
    }

    if (weight === undefined || weight === null) {
      throw new ErrorResponse(400, 'Trọng số là bắt buộc');
    }

    if (weight < 0 || weight > 100) {
      throw new ErrorResponse(400, 'Trọng số phải từ 0 đến 100');
    }

    if (maxScore === undefined || maxScore === null) {
      throw new ErrorResponse(400, 'Điểm tối đa là bắt buộc');
    }

    if (maxScore <= 0) {
      throw new ErrorResponse(400, 'Điểm tối đa phải lớn hơn 0');
    }

    // Check total weight
    const activeCriterias = await EvaluationCriteriaModel.find({ isActive: true }).lean();
    const totalWeight = activeCriterias.reduce((sum, c) => sum + c.weight, 0) + weight;

    if (totalWeight > 100) {
      throw new ErrorResponse(400, `Tổng trọng số không được vượt quá 100%. Hiện tại: ${totalWeight}%`);
    }

    const criteria = await EvaluationCriteriaModel.create({
      criterionName: criterionName.trim(),
      description: description?.trim() || '',
      weight,
      maxScore,
      isActive: true,
    });

    return res.status(201).json({
      message: 'Tạo tiêu chí đánh giá thành công',
      criteria,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in createEvaluationCriteria:', error);
    throw new ErrorResponse(500, 'Lỗi khi tạo tiêu chí đánh giá');
  }
};

exports.updateEvaluationCriteria = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ErrorResponse(403, 'Chỉ admin mới có quyền cập nhật tiêu chí đánh giá');
    }

    const { id } = req.params;
    const { criterionName, description, weight, maxScore, isActive } = req.body;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID tiêu chí không hợp lệ');
    }

    const criteria = await EvaluationCriteriaModel.findById(id);

    if (!criteria) {
      throw new ErrorResponse(404, 'Không tìm thấy tiêu chí đánh giá');
    }

    const updateData = {};

    if (criterionName !== undefined) {
      if (!criterionName || !criterionName.trim()) {
        throw new ErrorResponse(400, 'Tên tiêu chí là bắt buộc');
      }
      updateData.criterionName = criterionName.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    if (weight !== undefined) {
      if (weight < 0 || weight > 100) {
        throw new ErrorResponse(400, 'Trọng số phải từ 0 đến 100');
      }

      // Check total weight excluding current criteria
      const activeCriterias = await EvaluationCriteriaModel.find({
        isActive: true,
        _id: { $ne: id },
      }).lean();
      const totalWeight = activeCriterias.reduce((sum, c) => sum + c.weight, 0) + weight;

      if (totalWeight > 100) {
        throw new ErrorResponse(400, `Tổng trọng số không được vượt quá 100%. Hiện tại: ${totalWeight}%`);
      }

      updateData.weight = weight;
    }

    if (maxScore !== undefined) {
      if (maxScore <= 0) {
        throw new ErrorResponse(400, 'Điểm tối đa phải lớn hơn 0');
      }
      updateData.maxScore = maxScore;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedCriteria = await EvaluationCriteriaModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return res.status(200).json({
      message: 'Cập nhật tiêu chí đánh giá thành công',
      criteria: updatedCriteria,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in updateEvaluationCriteria:', error);
    throw new ErrorResponse(500, 'Lỗi khi cập nhật tiêu chí đánh giá');
  }
};

exports.deleteEvaluationCriteria = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ErrorResponse(403, 'Chỉ admin mới có quyền xóa tiêu chí đánh giá');
    }

    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID tiêu chí không hợp lệ');
    }

    const criteria = await EvaluationCriteriaModel.findById(id);

    if (!criteria) {
      throw new ErrorResponse(404, 'Không tìm thấy tiêu chí đánh giá');
    }

    // Soft delete by setting isActive to false
    await EvaluationCriteriaModel.findByIdAndUpdate(id, { isActive: false });

    return res.status(200).json({
      message: 'Xóa tiêu chí đánh giá thành công',
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in deleteEvaluationCriteria:', error);
    throw new ErrorResponse(500, 'Lỗi khi xóa tiêu chí đánh giá');
  }
};

// UC-51: Student Evaluation (Mentor)
exports.getActiveCriterias = async (req, res) => {
  try {
    const criterias = await EvaluationCriteriaModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      criterias,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getActiveCriterias:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách tiêu chí đánh giá');
  }
};

exports.getAssignedStudents = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem danh sách học sinh');
    }

    const mentorId = req.user._id;

    const lab = await LabModel.findOne({ mentor: mentorId, status: 'active' });

    if (!lab) {
      throw new ErrorResponse(404, 'Mentor chưa được gán lab');
    }

    const students = await StudentModel.find({ lab: lab._id })
      .populate('user', 'fullName email')
      .lean();

    const studentsList = students.map((student) => ({
      _id: student._id,
      fullName: student.user?.fullName || 'N/A',
      email: student.user?.email || 'N/A',
      studentCode: student.studentCode,
    }));

    return res.status(200).json({
      students: studentsList,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getAssignedStudents:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách học sinh');
  }
};

exports.createOrUpdateEvaluation = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền đánh giá học sinh');
    }

    const mentorId = req.user._id;
    const { studentId, criteriaScores } = req.body;

    if (!studentId || !/^[0-9a-fA-F]{24}$/.test(studentId)) {
      throw new ErrorResponse(400, 'ID học sinh không hợp lệ');
    }

    if (!criteriaScores || !Array.isArray(criteriaScores) || criteriaScores.length === 0) {
      throw new ErrorResponse(400, 'Danh sách điểm đánh giá là bắt buộc');
    }

    // Verify student is assigned to mentor
    const lab = await LabModel.findOne({ mentor: mentorId, status: 'active' });
    if (!lab) {
      throw new ErrorResponse(404, 'Mentor chưa được gán lab');
    }

    const student = await StudentModel.findOne({ _id: studentId, lab: lab._id });
    if (!student) {
      throw new ErrorResponse(403, 'Học sinh không thuộc lab của mentor');
    }

    // Get active criteria
    const activeCriterias = await EvaluationCriteriaModel.find({ isActive: true }).lean();
    if (activeCriterias.length === 0) {
      throw new ErrorResponse(400, 'Chưa có tiêu chí đánh giá nào được cấu hình');
    }

    // Validate criteria scores
    const criteriaMap = {};
    activeCriterias.forEach((c) => {
      criteriaMap[c._id.toString()] = c;
    });

    const validatedScores = [];
    for (const scoreData of criteriaScores) {
      const { criterionId, score, comment } = scoreData;

      if (!criterionId || !criteriaMap[criterionId]) {
        throw new ErrorResponse(400, `Tiêu chí ${criterionId} không hợp lệ hoặc không tồn tại`);
      }

      const criteria = criteriaMap[criterionId];

      if (score === undefined || score === null) {
        throw new ErrorResponse(400, `Điểm cho tiêu chí ${criteria.criterionName} là bắt buộc`);
      }

      if (score < 0 || score > criteria.maxScore) {
        throw new ErrorResponse(
          400,
          `Điểm cho tiêu chí ${criteria.criterionName} phải từ 0 đến ${criteria.maxScore}`
        );
      }

      validatedScores.push({
        criterionId: criteria._id,
        criterionName: criteria.criterionName,
        score: Number(score),
        maxScore: criteria.maxScore,
        weight: criteria.weight,
        comment: comment?.trim() || '',
      });
    }

    // Calculate total score
    let totalScore = 0;
    validatedScores.forEach((scoreData) => {
      const weightedScore = (scoreData.score / scoreData.maxScore) * scoreData.weight;
      totalScore += weightedScore;
    });

    // Check if evaluation exists
    const existingEvaluation = await EvaluationModel.findOne({
      student: studentId,
      mentor: mentorId,
      status: { $in: ['draft', 'completed'] },
    }).sort({ createdAt: -1 });

    let evaluation;
    if (existingEvaluation && existingEvaluation.status === 'draft') {
      // Update existing draft
      evaluation = await EvaluationModel.findByIdAndUpdate(
        existingEvaluation._id,
        {
          criteriaScores: validatedScores,
          totalScore,
          status: 'completed',
        },
        { new: true }
      );
    } else {
      // Create new evaluation
      evaluation = await EvaluationModel.create({
        student: studentId,
        mentor: mentorId,
        criteriaScores: validatedScores,
        totalScore,
        status: 'completed',
      });
    }

    return res.status(200).json({
      message: 'Lưu đánh giá thành công',
      evaluation,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in createOrUpdateEvaluation:', error);
    throw new ErrorResponse(500, 'Lỗi khi lưu đánh giá');
  }
};

exports.getEvaluationByStudent = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem đánh giá');
    }

    const mentorId = req.user._id;
    const { studentId } = req.params;

    if (!studentId || !/^[0-9a-fA-F]{24}$/.test(studentId)) {
      throw new ErrorResponse(400, 'ID học sinh không hợp lệ');
    }

    // Verify student is assigned to mentor
    const lab = await LabModel.findOne({ mentor: mentorId, status: 'active' });
    if (!lab) {
      throw new ErrorResponse(404, 'Mentor chưa được gán lab');
    }

    const student = await StudentModel.findOne({ _id: studentId, lab: lab._id });
    if (!student) {
      throw new ErrorResponse(403, 'Học sinh không thuộc lab của mentor');
    }

    const evaluation = await EvaluationModel.findOne({
      student: studentId,
      mentor: mentorId,
    })
      .populate({
        path: 'student',
        select: 'studentCode',
        populate: {
          path: 'user',
          select: 'fullName email',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      evaluation: evaluation || null,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getEvaluationByStudent:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy thông tin đánh giá');
  }
};

// UC-52: Submit Evaluation Report (Mentor)
exports.submitEvaluation = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền nộp báo cáo đánh giá');
    }

    const mentorId = req.user._id;
    const { evaluationId } = req.params;

    if (!evaluationId || !/^[0-9a-fA-F]{24}$/.test(evaluationId)) {
      throw new ErrorResponse(400, 'ID đánh giá không hợp lệ');
    }

    const evaluation = await EvaluationModel.findById(evaluationId);

    if (!evaluation) {
      throw new ErrorResponse(404, 'Không tìm thấy đánh giá');
    }

    if (evaluation.mentor.toString() !== mentorId.toString()) {
      throw new ErrorResponse(403, 'Bạn không có quyền nộp đánh giá này');
    }

    if (evaluation.status === 'submitted') {
      throw new ErrorResponse(400, 'Đánh giá đã được nộp');
    }

    if (evaluation.status !== 'completed') {
      throw new ErrorResponse(400, 'Đánh giá chưa hoàn thành. Vui lòng hoàn thành đánh giá trước khi nộp');
    }

    // Validate all criteria have scores
    if (!evaluation.criteriaScores || evaluation.criteriaScores.length === 0) {
      throw new ErrorResponse(400, 'Đánh giá chưa có điểm số');
    }

    const updatedEvaluation = await EvaluationModel.findByIdAndUpdate(
      evaluationId,
      {
        status: 'submitted',
        submittedDate: new Date(),
      },
      { new: true }
    )
      .populate({
        path: 'student',
        select: 'studentCode',
        populate: {
          path: 'user',
          select: 'fullName email',
        },
      })
      .lean();

    return res.status(200).json({
      message: 'Nộp báo cáo đánh giá thành công',
      evaluation: updatedEvaluation,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in submitEvaluation:', error);
    throw new ErrorResponse(500, 'Lỗi khi nộp báo cáo đánh giá');
  }
};

exports.getMentorEvaluations = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem danh sách đánh giá');
    }

    const mentorId = req.user._id;
    const { status } = req.query;

    const query = { mentor: mentorId };
    if (status) {
      query.status = status;
    }

    const evaluations = await EvaluationModel.find(query)
      .populate({
        path: 'student',
        select: 'studentCode',
        populate: {
          path: 'user',
          select: 'fullName email',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      evaluations,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getMentorEvaluations:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách đánh giá');
  }
};

// UC-53: View Evaluation Result (Student)
exports.getStudentEvaluation = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ học sinh mới có quyền xem kết quả đánh giá');
    }

    const userId = req.user._id;

    const student = await StudentModel.findOne({ user: userId });
    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin học sinh');
    }

    const evaluation = await EvaluationModel.findOne({
      student: student._id,
      status: { $in: ['submitted', 'completed'] },
    })
      .populate('mentor', 'fullName email')
      .sort({ submittedDate: -1, createdAt: -1 })
      .lean();

    if (!evaluation) {
      return res.status(200).json({
        evaluation: null,
        message: 'Chưa có kết quả đánh giá',
      });
    }

    return res.status(200).json({
      evaluation,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getStudentEvaluation:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy kết quả đánh giá');
  }
};

// UC-54: Evaluation Report List (OJT)
exports.getEvaluationReports = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ErrorResponse(403, 'Chỉ admin mới có quyền xem danh sách báo cáo đánh giá');
    }

    const { page = 1, limit = 20, status, departmentId } = req.query;
    const pageNum = Math.max(1, parseInt(page)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['submitted', 'completed'] };
    }

    // If filtering by department
    if (departmentId) {
      const students = await StudentModel.find({ lab: departmentId }).distinct('_id');
      query.student = { $in: students };
    }

    const evaluations = await EvaluationModel.find(query)
      .populate({
        path: 'student',
        populate: [
          {
            path: 'user',
            select: 'fullName email',
          },
          {
            path: 'lab',
            select: 'name code',
          },
        ],
      })
      .populate('mentor', 'fullName email')
      .sort({ submittedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await EvaluationModel.countDocuments(query);

    const reports = evaluations.map((eval) => ({
      _id: eval._id,
      studentName: eval.student?.user?.fullName || 'N/A',
      studentCode: eval.student?.studentCode || 'N/A',
      mentorName: eval.mentor?.fullName || 'N/A',
      department: eval.student?.lab?.name || 'N/A',
      totalScore: eval.totalScore,
      status: eval.status,
      submittedDate: eval.submittedDate || eval.createdAt,
    }));

    return res.status(200).json({
      reports,
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
    console.error('Error in getEvaluationReports:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách báo cáo đánh giá');
  }
};

exports.getEvaluationReportDetail = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ErrorResponse(403, 'Chỉ admin mới có quyền xem chi tiết báo cáo đánh giá');
    }

    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID báo cáo không hợp lệ');
    }

    const evaluation = await EvaluationModel.findById(id)
      .populate({
        path: 'student',
        populate: [
          {
            path: 'user',
            select: 'fullName email phoneNumber',
          },
          {
            path: 'lab',
            select: 'name code',
          },
        ],
      })
      .populate('mentor', 'fullName email')
      .lean();

    if (!evaluation) {
      throw new ErrorResponse(404, 'Không tìm thấy báo cáo đánh giá');
    }

    return res.status(200).json({
      evaluation,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getEvaluationReportDetail:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy chi tiết báo cáo đánh giá');
  }
};

