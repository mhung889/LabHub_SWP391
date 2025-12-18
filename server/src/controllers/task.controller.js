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

    const { taskTitle, description, startDate, dueDate, priority, complexity, status } = req.body;

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

    if (complexity && !['easy', 'medium', 'complex', 'veryComplex'].includes(complexity)) {
      throw new ErrorResponse(400, 'Mức độ phức tạp không hợp lệ');
    }

    if (status && !['Open', 'To do', 'In progress', 'Reviewing', 'Done', 'Cancel'].includes(status)) {
      throw new ErrorResponse(400, 'Trạng thái không hợp lệ');
    }

    const task = await TaskModel.create({
      taskTitle: taskTitle.trim(),
      description: description?.trim() || '',
      startDate: start,
      dueDate: due,
      priority: priority || 'medium',
      complexity: complexity || 'medium',
      status: status || 'Open',
      createdBy: mentorId,
    });

    // Nếu có studentId, tự động assign task
    if (studentId && /^[0-9a-fA-F]{24}$/.test(studentId)) {
      const lab = await require('../models/lab-model').findOne({ mentor: mentorId, status: 'active' });
      
      if (lab) {
        const StudentModel = require('../models/student-model');
        const student = await StudentModel.findOne({
          _id: studentId,
          lab: lab._id,
        });

        if (student) {
          // Xóa assignment cũ nếu có (vì chỉ cho phép 1 student)
          await TaskAssignmentModel.deleteMany({ task: task._id });
          
          // Tạo assignment mới
          await TaskAssignmentModel.create({
            task: task._id,
            student: studentId,
            progressStatus: 'notStarted',
          });
        }
      }
    }

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
    const { studentId } = req.body;

    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền gán task');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    if (!studentId || !/^[0-9a-fA-F]{24}$/.test(studentId)) {
      throw new ErrorResponse(400, 'ID student là bắt buộc và phải hợp lệ');
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

    const student = await StudentModel.findOne({
      _id: studentId,
      lab: lab._id,
    });

    if (!student) {
      throw new ErrorResponse(400, 'Student không hợp lệ hoặc không thuộc lab của mentor');
    }

    // Xóa tất cả assignment cũ của task này (vì chỉ cho phép 1 student)
    await TaskAssignmentModel.deleteMany({ task: id });

    // Tạo assignment mới
    const assignment = await TaskAssignmentModel.create({
      task: id,
      student: studentId,
      progressStatus: 'notStarted',
    });

    return res.status(200).json({
      message: 'Gán task thành công',
      assignment,
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
    const { taskTitle, description, startDate, dueDate, priority, complexity, status, studentId } = req.body;

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

    if (complexity !== undefined) {
      if (!['easy', 'medium', 'complex', 'veryComplex'].includes(complexity)) {
        throw new ErrorResponse(400, 'Mức độ phức tạp không hợp lệ');
      }
      updateData.complexity = complexity;
    }

    if (status !== undefined) {
      if (!['Open', 'To do', 'In progress', 'Reviewing', 'Done', 'Cancel'].includes(status)) {
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

    // Cập nhật từng field vào task object để đảm bảo validation chạy đúng
    Object.keys(updateData).forEach(key => {
      task[key] = updateData[key];
    });
    
    // Lưu với validation
    await task.save({ validateBeforeSave: true });
    
    // Nếu có studentId, tự động assign task
    if (studentId !== undefined) {
      const lab = await require('../models/lab-model').findOne({ mentor: mentorId, status: 'active' });
      
      if (lab) {
        if (studentId && /^[0-9a-fA-F]{24}$/.test(studentId)) {
          const StudentModel = require('../models/student-model');
          const student = await StudentModel.findOne({
            _id: studentId,
            lab: lab._id,
          });

          if (student) {
            // Xóa assignment cũ nếu có (vì chỉ cho phép 1 student)
            await TaskAssignmentModel.deleteMany({ task: id });
            
            // Tạo assignment mới
            await TaskAssignmentModel.create({
              task: id,
              student: studentId,
              progressStatus: 'notStarted',
            });
          }
        } else if (!studentId) {
          // Nếu studentId là null/empty, xóa assignment
          await TaskAssignmentModel.deleteMany({ task: id });
        }
      }
    }
    
    // Lấy lại task đã cập nhật
    const updatedTask = await TaskModel.findById(id);

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

// =====================================
// STUDENT TASK MANAGEMENT
// =====================================

exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ student mới có quyền xem task của mình');
    }

    // Tìm student từ userId
    const StudentModel = require('../models/student-model');
    const student = await StudentModel.findOne({ user: userId });

    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin student');
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page)) || 1;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Lấy các task assignment của student
    const assignments = await TaskAssignmentModel.find({ student: student._id })
      .populate({
        path: 'task',
        populate: {
          path: 'createdBy',
          select: 'fullName email',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const tasksWithProgress = assignments
      .filter((assignment) => assignment.task) // Lọc các task đã bị xóa
      .map((assignment) => ({
        _id: assignment.task._id,
        taskTitle: assignment.task.taskTitle,
        description: assignment.task.description,
        startDate: assignment.task.startDate,
        dueDate: assignment.task.dueDate,
        priority: assignment.task.priority,
        complexity: assignment.task.complexity,
        status: assignment.task.status,
        createdBy: assignment.task.createdBy,
        createdAt: assignment.task.createdAt,
        updatedAt: assignment.task.updatedAt,
        progressStatus: assignment.progressStatus,
        progressNote: assignment.progressNote,
        submissionFile: assignment.submissionFile,
        submittedAt: assignment.submittedAt,
        assignmentId: assignment._id,
      }));

    const total = await TaskAssignmentModel.countDocuments({ student: student._id });

    return res.status(200).json({
      tasks: tasksWithProgress,
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
    console.error('Error in getMyTasks:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách task');
  }
};

exports.getMyTaskById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ student mới có quyền xem task');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Tìm student từ userId
    const StudentModel = require('../models/student-model');
    const student = await StudentModel.findOne({ user: userId });

    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin student');
    }

    // Kiểm tra task có được gán cho student này không
    const assignment = await TaskAssignmentModel.findOne({
      task: id,
      student: student._id,
    })
      .populate({
        path: 'task',
        populate: {
          path: 'createdBy',
          select: 'fullName email',
        },
      })
      .lean();

    if (!assignment || !assignment.task) {
      throw new ErrorResponse(404, 'Không tìm thấy task hoặc task chưa được gán cho bạn');
    }

    return res.status(200).json({
      _id: assignment.task._id,
      taskTitle: assignment.task.taskTitle,
      description: assignment.task.description,
      startDate: assignment.task.startDate,
      dueDate: assignment.task.dueDate,
      priority: assignment.task.priority,
      complexity: assignment.task.complexity,
      status: assignment.task.status,
      createdBy: assignment.task.createdBy,
      createdAt: assignment.task.createdAt,
      updatedAt: assignment.task.updatedAt,
      progressStatus: assignment.progressStatus,
      progressNote: assignment.progressNote,
      submissionFile: assignment.submissionFile,
      submittedAt: assignment.submittedAt,
      assignmentId: assignment._id,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in getMyTaskById:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy thông tin task');
  }
};

exports.updateMyTaskProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { progressStatus, progressNote, submissionFile } = req.body;

    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ student mới có quyền cập nhật task');
    }

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Tìm student từ userId
    const StudentModel = require('../models/student-model');
    const student = await StudentModel.findOne({ user: userId });

    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin student');
    }

    // Kiểm tra task có được gán cho student này không
    const assignment = await TaskAssignmentModel.findOne({
      task: id,
      student: student._id,
    });

    if (!assignment) {
      throw new ErrorResponse(404, 'Không tìm thấy task hoặc task chưa được gán cho bạn');
    }

    const updateData = {};

    if (progressStatus !== undefined) {
      if (!['notStarted', 'inProgress', 'completed'].includes(progressStatus)) {
        throw new ErrorResponse(400, 'Trạng thái tiến độ không hợp lệ');
      }
      updateData.progressStatus = progressStatus;
    }

    if (progressNote !== undefined) {
      if (progressNote && progressNote.trim().length > 500) {
        throw new ErrorResponse(400, 'Ghi chú không được vượt quá 500 ký tự');
      }
      updateData.progressNote = progressNote?.trim() || '';
    }

    if (submissionFile !== undefined) {
      updateData.submissionFile = submissionFile?.trim() || '';
      if (submissionFile && submissionFile.trim()) {
        updateData.submittedAt = new Date();
      }
    }

    // Cập nhật assignment
    Object.keys(updateData).forEach((key) => {
      assignment[key] = updateData[key];
    });

    await assignment.save({ validateBeforeSave: true });

    // Lấy lại assignment đã cập nhật
    const updatedAssignment = await TaskAssignmentModel.findById(assignment._id)
      .populate({
        path: 'task',
        populate: {
          path: 'createdBy',
          select: 'fullName email',
        },
      })
      .lean();

    return res.status(200).json({
      message: 'Cập nhật tiến độ task thành công',
      assignment: updatedAssignment,
    });
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    console.error('Error in updateMyTaskProgress:', error);
    throw new ErrorResponse(500, 'Lỗi khi cập nhật tiến độ task');
  }
};

