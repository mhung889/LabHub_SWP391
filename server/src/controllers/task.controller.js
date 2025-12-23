// Import model Task để thao tác với dữ liệu task
const TaskModel = require('../models/task-model');
// Import model TaskAssignment để thao tác với dữ liệu gán task cho student
const TaskAssignmentModel = require('../models/task-assignment-model');
// Import model Student để thao tác với dữ liệu sinh viên
const StudentModel = require('../models/student-model');
// Import model User để thao tác với dữ liệu người dùng
const UserModel = require('../models/user-model');
// Import class ErrorResponse để xử lý lỗi
const ErrorResponse = require('../helpers/ErrorResponse');

/**
 * Hàm lấy danh sách task của mentor (bao gồm task của mentor và task của students trong lab)
 * @param {Object} req - Request object chứa user info và query parameters
 * @param {Object} res - Response object để trả về kết quả
 */
exports.getTasks = async (req, res) => {
  try {
    // Lấy ID của mentor từ user đã được xác thực
    const mentorId = req.user._id;
    
    // Kiểm tra role phải là mentor
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem danh sách task');
    }

    // Lấy các tham số phân trang từ query string
    const { page = 1, limit = 20 } = req.query;
    // Chuyển đổi số trang sang số nguyên, đảm bảo tối thiểu là 1
    const pageNum = Math.max(1, parseInt(page)) || 1;
    // Chuyển đổi số lượng mỗi trang sang số nguyên, giới hạn tối đa 100, tối thiểu 1, mặc định 20
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20;
    // Tính số bản ghi cần bỏ qua (skip) dựa trên số trang và số lượng mỗi trang
    const skip = (pageNum - 1) * limitNum;

    // Tìm lab active mà mentor này quản lý
    const LabModel = require('../models/lab-model');
    const lab = await LabModel.findOne({ mentor: mentorId, status: 'active' });

    // Lấy danh sách student trong lab
    const StudentModel = require('../models/student-model');
    // Khởi tạo mảng chứa user IDs của các student
    let studentUserIds = [];
    
    // Nếu có lab, lấy danh sách student trong lab đó
    if (lab) {
      // Tìm tất cả student trong lab và chỉ lấy field user
      const students = await StudentModel.find({ lab: lab._id }).select('user').lean();
      // Map để lấy danh sách user IDs
      studentUserIds = students.map(s => s.user);
    }

    // Tạo mảng chứa các ID của người tạo task: mentor và các student trong lab
    const createdByIds = [mentorId, ...studentUserIds];
    
    // Tìm tất cả task được tạo bởi mentor hoặc các student trong lab
    const tasks = await TaskModel.find({ createdBy: { $in: createdByIds } })
      .populate({
        path: 'createdBy',              // Populate thông tin người tạo
        select: 'fullName email role',  // Chỉ lấy các field cần thiết
      })
      .sort({ createdAt: -1 })         // Sắp xếp theo thời gian tạo mới nhất trước
      .skip(skip)                       // Bỏ qua số bản ghi theo phân trang
      .limit(limitNum)                  // Giới hạn số lượng bản ghi trả về
      .lean();                          // Trả về plain object

    // Thêm số lượng student đã được gán cho mỗi task
    const tasksWithCounts = await Promise.all(
      // Duyệt qua từng task
      tasks.map(async (task) => {
        // Đếm số lượng assignment của task này
        const assignedCount = await TaskAssignmentModel.countDocuments({ task: task._id });
        // Trả về task kèm số lượng student đã gán
        return {
          ...task,                      // Spread tất cả thuộc tính của task
          assignedStudentsCount: assignedCount,  // Thêm số lượng student đã gán
        };
      })
    );

    // Đếm tổng số task thỏa mãn điều kiện (không phân trang)
    const total = await TaskModel.countDocuments({ createdBy: { $in: createdByIds } });

    // Trả về kết quả với danh sách tasks và thông tin phân trang
    return res.status(200).json({
      tasks: tasksWithCounts,           // Danh sách tasks kèm số lượng student đã gán
      pagination: {
        total,                          // Tổng số tasks
        page: pageNum,                  // Trang hiện tại
        limit: limitNum,                // Số lượng mỗi trang
        totalPages: Math.ceil(total / limitNum),  // Tổng số trang
      },
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in getTasks:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách task');
  }
};

/**
 * Hàm lấy thông tin chi tiết của một task theo ID
 * @param {Object} req - Request object chứa task ID trong params và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.getTaskById = async (req, res) => {
  try {
    // Lấy ID của mentor từ user đã được xác thực
    const mentorId = req.user._id;
    // Lấy ID task từ params
    const { id } = req.params;

    // Kiểm tra role phải là mentor
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xem task');
    }

    // Validate ID: phải là MongoDB ObjectId hợp lệ (24 ký tự hex)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Tìm task trong database theo ID
    const task = await TaskModel.findById(id).lean();

    // Kiểm tra task có tồn tại không
    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    // Kiểm tra quyền: mentor có thể xem task của mình hoặc task của student trong lab
    if (task.createdBy.toString() !== mentorId.toString()) {
      // Kiểm tra xem task có phải của student trong lab của mentor không
      const LabModel = require('../models/lab-model');
      // Tìm lab active mà mentor này quản lý
      const lab = await LabModel.findOne({ mentor: mentorId, status: 'active' });
      
      // Nếu có lab, kiểm tra xem student tạo task có thuộc lab này không
      if (lab) {
        const StudentModel = require('../models/student-model');
        const student = await StudentModel.findOne({ 
          user: task.createdBy,    // User ID của người tạo task
          lab: lab._id            // Phải thuộc lab của mentor
        });
       
        // Nếu không tìm thấy student trong lab, mentor không có quyền xem task này
        // (Lưu ý: code hiện tại không throw lỗi ở đây, có thể là bug)
      } else {
        // Nếu mentor không có lab, không có quyền xem task
        throw new ErrorResponse(403, 'Bạn không có quyền xem task này');
      }
    }

    // Tìm tất cả assignment của task này
    const assignments = await TaskAssignmentModel.find({ task: id })
      .populate({
        path: 'student',              // Populate thông tin student
        populate: {
          path: 'user',                // Populate thông tin user của student
          select: 'fullName email',    // Chỉ lấy fullName và email
        },
      })
      .lean();                        // Trả về plain object

    // Transform dữ liệu assignment thành format dễ sử dụng
    const assignedStudents = assignments.map((assignment) => ({
      studentId: assignment.student._id,                                    // ID của student
      fullName: assignment.student.user?.fullName || 'N/A',                 // Họ tên student
      email: assignment.student.user?.email || 'N/A',                       // Email student
      progress: assignment.progressStatus,                                  // Trạng thái tiến độ
      submissionStatus: assignment.submissionFile ? 'submitted' : 'notSubmitted',  // Trạng thái nộp bài
      progressNote: assignment.progressNote,                                // Ghi chú tiến độ
      submittedAt: assignment.submittedAt,                                  // Thời gian nộp bài
    }));

    // Trả về thông tin task kèm danh sách student đã gán
    return res.status(200).json({
      ...task,                    // Spread tất cả thuộc tính của task
      assignedStudents,           // Danh sách student đã gán
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in getTaskById:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy thông tin task');
  }
};

/**
 * Hàm tạo task mới
 * @param {Object} req - Request object chứa thông tin task trong body và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.createTask = async (req, res) => {
  try {
    // Lấy ID của mentor từ user đã được xác thực
    const mentorId = req.user._id;

    // Kiểm tra role phải là mentor
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền tạo task');
    }

    // Lấy các thông tin từ request body
    const { taskTitle, description, startDate, dueDate, priority, complexity, status, studentId } = req.body;

    // Validate taskTitle: bắt buộc và không được để trống
    if (!taskTitle || !taskTitle.trim()) {
      throw new ErrorResponse(400, 'Tiêu đề task là bắt buộc');
    }

    // Validate độ dài taskTitle: không được vượt quá 200 ký tự
    if (taskTitle.trim().length > 200) {
      throw new ErrorResponse(400, 'Tiêu đề task không được vượt quá 200 ký tự');
    }

    // Validate startDate: bắt buộc
    if (!startDate) {
      throw new ErrorResponse(400, 'Ngày bắt đầu là bắt buộc');
    }

    // Validate dueDate: bắt buộc
    if (!dueDate) {
      throw new ErrorResponse(400, 'Ngày hết hạn là bắt buộc');
    }

    // Chuyển đổi startDate và dueDate sang đối tượng Date
    const start = new Date(startDate);
    const due = new Date(dueDate);

    // Validate startDate có hợp lệ không
    if (isNaN(start.getTime())) {
      throw new ErrorResponse(400, 'Ngày bắt đầu không hợp lệ');
    }

    // Validate dueDate có hợp lệ không
    if (isNaN(due.getTime())) {
      throw new ErrorResponse(400, 'Ngày hết hạn không hợp lệ');
    }

    // Validate startDate phải nhỏ hơn hoặc bằng dueDate
    if (start > due) {
      throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
    }

    // Validate priority: nếu có thì phải là một trong các giá trị hợp lệ
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      throw new ErrorResponse(400, 'Độ ưu tiên không hợp lệ');
    }

    // Validate complexity: nếu có thì phải là một trong các giá trị hợp lệ
    if (complexity && !['easy', 'medium', 'complex', 'veryComplex'].includes(complexity)) {
      throw new ErrorResponse(400, 'Mức độ phức tạp không hợp lệ');
    }

    // Validate status: nếu có thì phải là một trong các giá trị hợp lệ
    if (status && !['Open', 'To do', 'In progress', 'Reviewing', 'Done', 'Cancel'].includes(status)) {
      throw new ErrorResponse(400, 'Trạng thái không hợp lệ');
    }

    // Tạo task mới trong database
    const task = await TaskModel.create({
      taskTitle: taskTitle.trim(),                    // Tiêu đề đã trim
      description: description?.trim() || '',          // Mô tả (nếu có) hoặc chuỗi rỗng
      startDate: start,                               // Ngày bắt đầu
      dueDate: due,                                  // Ngày hết hạn
      priority: priority || 'medium',                 // Độ ưu tiên (mặc định: medium)
      complexity: complexity || 'medium',             // Mức độ phức tạp (mặc định: medium)
      status: status || 'Open',                       // Trạng thái (mặc định: Open)
      createdBy: mentorId,                           // ID của mentor tạo task
    });

    // Nếu có studentId, tự động gán task cho student đó
    if (studentId && /^[0-9a-fA-F]{24}$/.test(studentId)) {
      // Tìm lab active mà mentor này quản lý
      const lab = await require('../models/lab-model').findOne({ mentor: mentorId, status: 'active' });
      
      // Nếu có lab, kiểm tra student có thuộc lab này không
      if (lab) {
        const StudentModel = require('../models/student-model');
        // Tìm student trong lab của mentor
        const student = await StudentModel.findOne({
          _id: studentId,        // ID của student
          lab: lab._id,         // Phải thuộc lab của mentor
        });

        // Nếu tìm thấy student, tạo assignment
        if (student) {
          // Xóa tất cả assignment cũ của task này (vì chỉ cho phép 1 student)
          await TaskAssignmentModel.deleteMany({ task: task._id });
          
          // Tạo assignment mới
          await TaskAssignmentModel.create({
            task: task._id,                    // ID của task
            student: studentId,                // ID của student
            progressStatus: 'notStarted',      // Trạng thái tiến độ mặc định: chưa bắt đầu
          });
        }
      }
    }

    // Trả về kết quả thành công
    return res.status(201).json({
      message: 'Tạo task thành công',
      task,
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in createTask:', error);
    throw new ErrorResponse(500, 'Lỗi khi tạo task');
  }
};

/**
 * Hàm gán task cho student
 * @param {Object} req - Request object chứa task ID trong params, studentId trong body và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.assignTask = async (req, res) => {
  try {
    // Lấy ID của mentor từ user đã được xác thực
    const mentorId = req.user._id;
    // Lấy ID task từ params
    const { id } = req.params;
    // Lấy ID student từ request body
    const { studentId } = req.body;

    // Kiểm tra role phải là mentor
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền gán task');
    }

    // Validate ID task: phải là MongoDB ObjectId hợp lệ
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Validate ID student: bắt buộc và phải là MongoDB ObjectId hợp lệ
    if (!studentId || !/^[0-9a-fA-F]{24}$/.test(studentId)) {
      throw new ErrorResponse(400, 'ID student là bắt buộc và phải hợp lệ');
    }

    // Tìm task trong database
    const task = await TaskModel.findById(id);

    // Kiểm tra task có tồn tại không
    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    // Kiểm tra quyền: chỉ mentor tạo task mới có quyền gán task
    if (task.createdBy.toString() !== mentorId.toString()) {
      throw new ErrorResponse(403, 'Bạn không có quyền gán task này');
    }

    // Tìm lab active mà mentor này quản lý
    const lab = await require('../models/lab-model').findOne({ mentor: mentorId, status: 'active' });
    
    // Kiểm tra mentor có lab không
    if (!lab) {
      throw new ErrorResponse(404, 'Mentor chưa được gán lab');
    }

    // Tìm student trong lab của mentor
    const student = await StudentModel.findOne({
      _id: studentId,        // ID của student
      lab: lab._id,         // Phải thuộc lab của mentor
    });

    // Kiểm tra student có hợp lệ và thuộc lab của mentor không
    if (!student) {
      throw new ErrorResponse(400, 'Student không hợp lệ hoặc không thuộc lab của mentor');
    }

    // Xóa tất cả assignment cũ của task này (vì chỉ cho phép 1 student)
    await TaskAssignmentModel.deleteMany({ task: id });

    // Tạo assignment mới
    const assignment = await TaskAssignmentModel.create({
      task: id,                      // ID của task
      student: studentId,            // ID của student
      progressStatus: 'notStarted',  // Trạng thái tiến độ mặc định: chưa bắt đầu
    });

    // Trả về kết quả thành công
    return res.status(200).json({
      message: 'Gán task thành công',
      assignment,
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in assignTask:', error);
    throw new ErrorResponse(500, 'Lỗi khi gán task');
  }
};

/**
 * Hàm cập nhật task
 * @param {Object} req - Request object chứa task ID trong params, dữ liệu cập nhật trong body và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.updateTask = async (req, res) => {
  try {
    // Lấy ID của mentor từ user đã được xác thực
    const mentorId = req.user._id;
    // Lấy ID task từ params
    const { id } = req.params;
    // Lấy dữ liệu cập nhật từ request body
    const { taskTitle, description, startDate, dueDate, priority, complexity, status, studentId } = req.body;

    // Kiểm tra role phải là mentor
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền cập nhật task');
    }

    // Validate ID task: phải là MongoDB ObjectId hợp lệ
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Tìm task trong database
    const task = await TaskModel.findById(id);

    // Kiểm tra task có tồn tại không
    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    // Kiểm tra quyền: mentor có thể update task của mình hoặc task của student trong lab
    if (task.createdBy.toString() !== mentorId.toString()) {
      // Kiểm tra xem task có phải của student trong lab của mentor không
      const LabModel = require('../models/lab-model');
      // Tìm lab active mà mentor này quản lý
      const lab = await LabModel.findOne({ mentor: mentorId, status: 'active' });
      
      // Nếu có lab, kiểm tra student tạo task có thuộc lab này không
      if (lab) {
        const StudentModel = require('../models/student-model');
        // Tìm student trong lab của mentor
        const student = await StudentModel.findOne({ 
          user: task.createdBy,    // User ID của người tạo task
          lab: lab._id            // Phải thuộc lab của mentor
        });
        
        // Nếu không tìm thấy student trong lab, không có quyền cập nhật
        if (!student) {
          throw new ErrorResponse(403, 'Bạn không có quyền cập nhật task này');
        }
      } else {
        // Nếu mentor không có lab, không có quyền cập nhật
        throw new ErrorResponse(403, 'Bạn không có quyền cập nhật task này');
      }
    }

    // Khởi tạo object chứa dữ liệu cập nhật
    const updateData = {};

    // Xử lý cập nhật taskTitle (nếu có)
    if (taskTitle !== undefined) {
      // Validate taskTitle không được để trống
      if (!taskTitle || !taskTitle.trim()) {
        throw new ErrorResponse(400, 'Tiêu đề task là bắt buộc');
      }
      // Validate độ dài taskTitle: không được vượt quá 200 ký tự
      if (taskTitle.trim().length > 200) {
        throw new ErrorResponse(400, 'Tiêu đề task không được vượt quá 200 ký tự');
      }
      // Thêm taskTitle vào updateData
      updateData.taskTitle = taskTitle.trim();
    }

    // Xử lý cập nhật description (nếu có)
    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    // Xử lý cập nhật startDate (nếu có)
    if (startDate !== undefined) {
      // Chuyển đổi startDate sang đối tượng Date
      const start = new Date(startDate);
      // Validate startDate có hợp lệ không
      if (isNaN(start.getTime())) {
        throw new ErrorResponse(400, 'Ngày bắt đầu không hợp lệ');
      }
      // Thêm startDate vào updateData
      updateData.startDate = start;
    }

    // Xử lý cập nhật dueDate (nếu có)
    if (dueDate !== undefined) {
      // Chuyển đổi dueDate sang đối tượng Date
      const due = new Date(dueDate);
      // Validate dueDate có hợp lệ không
      if (isNaN(due.getTime())) {
        throw new ErrorResponse(400, 'Ngày hết hạn không hợp lệ');
      }
      // Thêm dueDate vào updateData
      updateData.dueDate = due;
    }

    // Xử lý cập nhật priority (nếu có)
    if (priority !== undefined) {
      // Validate priority phải là một trong các giá trị hợp lệ
      if (!['low', 'medium', 'high'].includes(priority)) {
        throw new ErrorResponse(400, 'Độ ưu tiên không hợp lệ');
      }
      // Thêm priority vào updateData
      updateData.priority = priority;
    }

    // Xử lý cập nhật complexity (nếu có)
    if (complexity !== undefined) {
      // Validate complexity phải là một trong các giá trị hợp lệ
      if (!['easy', 'medium', 'complex', 'veryComplex'].includes(complexity)) {
        throw new ErrorResponse(400, 'Mức độ phức tạp không hợp lệ');
      }
      // Thêm complexity vào updateData
      updateData.complexity = complexity;
    }

    // Xử lý cập nhật status (nếu có)
    if (status !== undefined) {
      // Validate status phải là một trong các giá trị hợp lệ
      if (!['Open', 'To do', 'In progress', 'Reviewing', 'Done', 'Cancel'].includes(status)) {
        throw new ErrorResponse(400, 'Trạng thái không hợp lệ');
      }
      // Thêm status vào updateData
      updateData.status = status;
    }
    
    // Validate startDate phải nhỏ hơn hoặc bằng dueDate (kiểm tra các trường hợp)
    if (updateData.startDate && updateData.dueDate) {
      // Nếu cả startDate và dueDate đều được cập nhật
      if (updateData.startDate > updateData.dueDate) {
        throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
      }
    } else if (updateData.startDate && task.dueDate) {
      // Nếu chỉ startDate được cập nhật, so sánh với dueDate hiện tại
      if (updateData.startDate > task.dueDate) {
        throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
      }
    } else if (task.startDate && updateData.dueDate) {
      // Nếu chỉ dueDate được cập nhật, so sánh với startDate hiện tại
      if (task.startDate > updateData.dueDate) {
        throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
      }
    }

    // Cập nhật từng field vào task object để đảm bảo validation chạy đúng
    Object.keys(updateData).forEach(key => {
      task[key] = updateData[key];
    });
    
    // Lưu task với validation (để chạy các validation trong schema)
    await task.save({ validateBeforeSave: true });
    
    // Nếu có studentId, tự động gán task cho student đó
    if (studentId !== undefined) {
      // Tìm lab active mà mentor này quản lý
      const lab = await require('../models/lab-model').findOne({ mentor: mentorId, status: 'active' });
      
      // Nếu có lab, kiểm tra student có thuộc lab này không
      if (lab) {
        // Nếu studentId hợp lệ
        if (studentId && /^[0-9a-fA-F]{24}$/.test(studentId)) {
          const StudentModel = require('../models/student-model');
          // Tìm student trong lab của mentor
          const student = await StudentModel.findOne({
            _id: studentId,        // ID của student
            lab: lab._id,         // Phải thuộc lab của mentor
          });

          // Nếu tìm thấy student, tạo assignment
          if (student) {
            // Xóa tất cả assignment cũ của task này (vì chỉ cho phép 1 student)
            await TaskAssignmentModel.deleteMany({ task: id });
            
            // Tạo assignment mới
            await TaskAssignmentModel.create({
              task: id,                      // ID của task
              student: studentId,            // ID của student
              progressStatus: 'notStarted',  // Trạng thái tiến độ mặc định: chưa bắt đầu
            });
          }
        } else if (!studentId) {
          // Nếu studentId là null/empty, xóa tất cả assignment
          await TaskAssignmentModel.deleteMany({ task: id });
        }
      }
    }
    
    // Lấy lại task đã cập nhật từ database
    const updatedTask = await TaskModel.findById(id);

    // Trả về kết quả thành công
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

/**
 * Hàm xóa task
 * @param {Object} req - Request object chứa task ID trong params và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.deleteTask = async (req, res) => {
  try {
    // Lấy ID của mentor từ user đã được xác thực
    const mentorId = req.user._id;
    // Lấy ID task từ params
    const { id } = req.params;

    // Kiểm tra role phải là mentor
    if (req.user.role !== 'mentor') {
      throw new ErrorResponse(403, 'Chỉ mentor mới có quyền xóa task');
    }

    // Validate ID task: phải là MongoDB ObjectId hợp lệ
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Tìm task trong database
    const task = await TaskModel.findById(id);

    // Kiểm tra task có tồn tại không
    if (!task) {
      throw new ErrorResponse(404, 'Không tìm thấy task');
    }

    // Kiểm tra quyền: mentor có thể xóa task của mình hoặc task của student trong lab
    if (task.createdBy.toString() !== mentorId.toString()) {
      // Kiểm tra xem task có phải của student trong lab của mentor không
      const LabModel = require('../models/lab-model');
      // Tìm lab active mà mentor này quản lý
      const lab = await LabModel.findOne({ mentor: mentorId, status: 'active' });
      
      // Nếu có lab, kiểm tra student tạo task có thuộc lab này không
      if (lab) {
        const StudentModel = require('../models/student-model');
        // Tìm student trong lab của mentor
        const student = await StudentModel.findOne({ 
          user: task.createdBy,    // User ID của người tạo task
          lab: lab._id            // Phải thuộc lab của mentor
        });
        
        // Nếu không tìm thấy student trong lab, không có quyền xóa
        if (!student) {
          throw new ErrorResponse(403, 'Bạn không có quyền xóa task này');
        }
      } else {
        // Nếu mentor không có lab, không có quyền xóa
        throw new ErrorResponse(403, 'Bạn không có quyền xóa task này');
      }
    }

    // Xóa tất cả assignment của task này trước
    await TaskAssignmentModel.deleteMany({ task: id });
    // Xóa task khỏi database
    await TaskModel.findByIdAndDelete(id);

    // Trả về kết quả thành công
    return res.status(200).json({
      message: 'Xóa task thành công',
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
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
// STUDENT TASK MANAGEMENT - Quản lý task của student
// =====================================

/**
 * Hàm lấy danh sách task của student (task được gán cho student hoặc task student tự tạo)
 * @param {Object} req - Request object chứa user info và query parameters
 * @param {Object} res - Response object để trả về kết quả
 */
exports.getMyTasks = async (req, res) => {
  try {
    // Lấy ID của user từ user đã được xác thực
    const userId = req.user._id;

    // Kiểm tra role phải là student
    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ student mới có quyền xem task của mình');
    }

    // Tìm student record từ userId
    const StudentModel = require('../models/student-model');
    const student = await StudentModel.findOne({ user: userId });

    // Kiểm tra student có tồn tại không
    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin student');
    }

    // Lấy các tham số phân trang từ query string
    const { page = 1, limit = 20 } = req.query;
    // Chuyển đổi số trang sang số nguyên, đảm bảo tối thiểu là 1
    const pageNum = Math.max(1, parseInt(page)) || 1;
    // Chuyển đổi số lượng mỗi trang sang số nguyên, giới hạn tối đa 100, tối thiểu 1, mặc định 20
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 20;
    // Tính số bản ghi cần bỏ qua (skip) dựa trên số trang và số lượng mỗi trang
    const skip = (pageNum - 1) * limitNum;

    // Lấy các task assignment của student (task được gán cho student này)
    const assignments = await TaskAssignmentModel.find({ student: student._id })
      .populate({
        path: 'task',              // Populate thông tin task
        populate: {
          path: 'createdBy',      // Populate thông tin người tạo task
          select: 'fullName email',  // Chỉ lấy fullName và email
        },
      })
      .sort({ createdAt: -1 })     // Sắp xếp theo thời gian tạo mới nhất trước
      .skip(skip)                  // Bỏ qua số bản ghi theo phân trang
      .limit(limitNum)             // Giới hạn số lượng bản ghi trả về
      .lean();                     // Trả về plain object

    // Transform dữ liệu assignment thành format dễ sử dụng
    const tasksWithProgress = assignments
      .filter((assignment) => assignment.task)  // Lọc các task đã bị xóa (task = null)
      .map((assignment) => ({
        _id: assignment.task._id,                    // ID của task
        taskTitle: assignment.task.taskTitle,        // Tiêu đề task
        description: assignment.task.description,    // Mô tả task
        startDate: assignment.task.startDate,        // Ngày bắt đầu
        dueDate: assignment.task.dueDate,            // Ngày hết hạn
        priority: assignment.task.priority,          // Độ ưu tiên
        complexity: assignment.task.complexity,      // Mức độ phức tạp
        status: assignment.task.status,              // Trạng thái task
        createdBy: assignment.task.createdBy,        // Thông tin người tạo (mentor hoặc student)
        createdAt: assignment.task.createdAt,        // Thời gian tạo task
        updatedAt: assignment.task.updatedAt,        // Thời gian cập nhật task
        // Thông tin từ assignment
        progressStatus: assignment.progressStatus,   // Trạng thái tiến độ
        progressNote: assignment.progressNote,       // Ghi chú tiến độ
        submissionFile: assignment.submissionFile,   // File nộp bài
        submittedAt: assignment.submittedAt,        // Thời gian nộp bài
        assignmentId: assignment._id,               // ID của assignment
      }));

    // Đếm tổng số assignment của student (không phân trang)
    const total = await TaskAssignmentModel.countDocuments({ student: student._id });

    // Trả về kết quả với danh sách tasks và thông tin phân trang
    return res.status(200).json({
      tasks: tasksWithProgress,     // Danh sách tasks kèm thông tin progress
      pagination: {
        total,                      // Tổng số tasks
        page: pageNum,              // Trang hiện tại
        limit: limitNum,            // Số lượng mỗi trang
        totalPages: Math.ceil(total / limitNum),  // Tổng số trang
      },
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in getMyTasks:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy danh sách task');
  }
};

/**
 * Hàm lấy thông tin chi tiết của một task theo ID (student)
 * @param {Object} req - Request object chứa task ID trong params và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.getMyTaskById = async (req, res) => {
  try {
    // Lấy ID của user từ user đã được xác thực
    const userId = req.user._id;
    // Lấy ID task từ params
    const { id } = req.params;

    // Kiểm tra role phải là student
    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ student mới có quyền xem task');
    }

    // Validate ID task: phải là MongoDB ObjectId hợp lệ
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Tìm student record từ userId
    const StudentModel = require('../models/student-model');
    const student = await StudentModel.findOne({ user: userId });

    // Kiểm tra student có tồn tại không
    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin student');
    }

    // Kiểm tra task có được gán cho student này không
    const assignment = await TaskAssignmentModel.findOne({
      task: id,              // ID của task
      student: student._id,  // ID của student
    })
      .populate({
        path: 'task',              // Populate thông tin task
        populate: {
          path: 'createdBy',      // Populate thông tin người tạo task
          select: 'fullName email',  // Chỉ lấy fullName và email
        },
      })
      .lean();                    // Trả về plain object

    // Kiểm tra assignment và task có tồn tại không
    if (!assignment || !assignment.task) {
      throw new ErrorResponse(404, 'Không tìm thấy task hoặc task chưa được gán cho bạn');
    }

    // Trả về thông tin task kèm thông tin progress từ assignment
    return res.status(200).json({
      _id: assignment.task._id,                    // ID của task
      taskTitle: assignment.task.taskTitle,        // Tiêu đề task
      description: assignment.task.description,    // Mô tả task
      startDate: assignment.task.startDate,        // Ngày bắt đầu
      dueDate: assignment.task.dueDate,            // Ngày hết hạn
      priority: assignment.task.priority,          // Độ ưu tiên
      complexity: assignment.task.complexity,      // Mức độ phức tạp
      status: assignment.task.status,              // Trạng thái task
      createdBy: assignment.task.createdBy,        // Thông tin người tạo (mentor hoặc student)
      createdAt: assignment.task.createdAt,        // Thời gian tạo task
      updatedAt: assignment.task.updatedAt,        // Thời gian cập nhật task
      // Thông tin từ assignment
      progressStatus: assignment.progressStatus,   // Trạng thái tiến độ
      progressNote: assignment.progressNote,       // Ghi chú tiến độ
      submissionFile: assignment.submissionFile,   // File nộp bài
      submittedAt: assignment.submittedAt,         // Thời gian nộp bài
      assignmentId: assignment._id,                // ID của assignment
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in getMyTaskById:', error);
    throw new ErrorResponse(500, 'Lỗi khi lấy thông tin task');
  }
};

/**
 * Hàm cập nhật tiến độ task của student (status và note)
 * @param {Object} req - Request object chứa task ID trong params, dữ liệu cập nhật trong body và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.updateMyTaskProgress = async (req, res) => {
  try {
    // Lấy ID của user từ user đã được xác thực
    const userId = req.user._id;
    // Lấy ID task từ params
    const { id } = req.params;
    // Lấy dữ liệu cập nhật từ request body
    const { status, note, progressStatus, progressNote, submissionFile } = req.body;

    // Kiểm tra role phải là student
    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ student mới có quyền cập nhật task');
    }

    // Validate ID task: phải là MongoDB ObjectId hợp lệ
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ErrorResponse(400, 'ID task không hợp lệ');
    }

    // Tìm student record từ userId
    const StudentModel = require('../models/student-model');
    const student = await StudentModel.findOne({ user: userId });

    // Kiểm tra student có tồn tại không
    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin student');
    }

    // Kiểm tra task có được gán cho student này không
    const assignment = await TaskAssignmentModel.findOne({
      task: id,              // ID của task
      student: student._id,  // ID của student
    }).populate('task');     // Populate thông tin task

    // Kiểm tra assignment và task có tồn tại không
    if (!assignment || !assignment.task) {
      throw new ErrorResponse(404, 'Không tìm thấy task hoặc task chưa được gán cho bạn');
    }

    // Lấy task từ assignment
    const task = assignment.task;
    // Khởi tạo object chứa dữ liệu cập nhật cho task
    const updateTaskData = {};
    // Khởi tạo object chứa dữ liệu cập nhật cho assignment
    const updateAssignmentData = {};

    // Cập nhật status của task (nếu có)
    if (status !== undefined) {
      // Validate status phải là một trong các giá trị hợp lệ
      if (!['Open', 'To do', 'In progress', 'Reviewing', 'Done', 'Cancel'].includes(status)) {
        throw new ErrorResponse(400, 'Trạng thái không hợp lệ');
      }
      // Thêm status vào updateTaskData
      updateTaskData.status = status;
    }

    // Cập nhật note (lưu vào progressNote của assignment)
    if (note !== undefined) {
      // Validate độ dài note: không được vượt quá 500 ký tự
      if (note && note.trim().length > 500) {
        throw new ErrorResponse(400, 'Ghi chú không được vượt quá 500 ký tự');
      }
      // Thêm progressNote vào updateAssignmentData
      updateAssignmentData.progressNote = note?.trim() || '';
    }

    // Xử lý cập nhật progressStatus (nếu có) - giữ lại để tương thích với code cũ
    if (progressStatus !== undefined) {
      // Validate progressStatus phải là một trong các giá trị hợp lệ
      if (!['notStarted', 'inProgress', 'completed'].includes(progressStatus)) {
        throw new ErrorResponse(400, 'Trạng thái tiến độ không hợp lệ');
      }
      // Thêm progressStatus vào updateAssignmentData
      updateAssignmentData.progressStatus = progressStatus;
    }

    // Xử lý cập nhật progressNote (nếu có) - giữ lại để tương thích với code cũ
    if (progressNote !== undefined) {
      // Validate độ dài progressNote: không được vượt quá 500 ký tự
      if (progressNote && progressNote.trim().length > 500) {
        throw new ErrorResponse(400, 'Ghi chú không được vượt quá 500 ký tự');
      }
      // Thêm progressNote vào updateAssignmentData
      updateAssignmentData.progressNote = progressNote?.trim() || '';
    }

    // Xử lý cập nhật submissionFile (nếu có)
    if (submissionFile !== undefined) {
      // Thêm submissionFile vào updateAssignmentData
      updateAssignmentData.submissionFile = submissionFile?.trim() || '';
      // Nếu có file, cập nhật thời gian nộp bài
      if (submissionFile && submissionFile.trim()) {
        updateAssignmentData.submittedAt = new Date();
      }
    }

    // Cập nhật task nếu có dữ liệu cần cập nhật
    if (Object.keys(updateTaskData).length > 0) {
      // Cập nhật từng field vào task object
      Object.keys(updateTaskData).forEach((key) => {
        task[key] = updateTaskData[key];
      });
      // Lưu task với validation
      await task.save({ validateBeforeSave: true });
    }

    // Cập nhật assignment nếu có dữ liệu cần cập nhật
    if (Object.keys(updateAssignmentData).length > 0) {
      // Cập nhật từng field vào assignment object
      Object.keys(updateAssignmentData).forEach((key) => {
        assignment[key] = updateAssignmentData[key];
      });
      // Lưu assignment với validation
      await assignment.save({ validateBeforeSave: true });
    }

    // Lấy lại assignment đã cập nhật từ database với đầy đủ thông tin
    const updatedAssignment = await TaskAssignmentModel.findById(assignment._id)
      .populate({
        path: 'task',              // Populate thông tin task
        populate: {
          path: 'createdBy',      // Populate thông tin người tạo task
          select: 'fullName email',  // Chỉ lấy fullName và email
        },
      })
      .lean();                    // Trả về plain object

    // Trả về kết quả thành công
    return res.status(200).json({
      message: 'Cập nhật tiến độ task thành công',
      assignment: updatedAssignment,
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in updateMyTaskProgress:', error);
    throw new ErrorResponse(500, 'Lỗi khi cập nhật tiến độ task');
  }
};

/**
 * Hàm tạo task mới của student (student tự tạo task cho bản thân)
 * @param {Object} req - Request object chứa thông tin task trong body và user info
 * @param {Object} res - Response object để trả về kết quả
 */
exports.createMyTask = async (req, res) => {
  try {
    // Lấy ID của user từ user đã được xác thực
    const userId = req.user._id;

    // Kiểm tra role phải là student
    if (req.user.role !== 'student') {
      throw new ErrorResponse(403, 'Chỉ student mới có quyền tạo task');
    }

    // Lấy các thông tin từ request body
    const { taskTitle, description, startDate, dueDate, priority, complexity, status } = req.body;

    // Validate taskTitle: bắt buộc và không được để trống
    if (!taskTitle || !taskTitle.trim()) {
      throw new ErrorResponse(400, 'Tiêu đề task là bắt buộc');
    }

    // Validate độ dài taskTitle: không được vượt quá 200 ký tự
    if (taskTitle.trim().length > 200) {
      throw new ErrorResponse(400, 'Tiêu đề task không được vượt quá 200 ký tự');
    }

    // Validate startDate: bắt buộc
    if (!startDate) {
      throw new ErrorResponse(400, 'Ngày bắt đầu là bắt buộc');
    }

    // Validate dueDate: bắt buộc
    if (!dueDate) {
      throw new ErrorResponse(400, 'Ngày hết hạn là bắt buộc');
    }

    // Chuyển đổi startDate và dueDate sang đối tượng Date
    const start = new Date(startDate);
    const due = new Date(dueDate);

    // Validate startDate có hợp lệ không
    if (isNaN(start.getTime())) {
      throw new ErrorResponse(400, 'Ngày bắt đầu không hợp lệ');
    }

    // Validate dueDate có hợp lệ không
    if (isNaN(due.getTime())) {
      throw new ErrorResponse(400, 'Ngày hết hạn không hợp lệ');
    }

    // Validate startDate phải nhỏ hơn hoặc bằng dueDate
    if (start > due) {
      throw new ErrorResponse(400, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hết hạn');
    }

    // Validate priority: nếu có thì phải là một trong các giá trị hợp lệ
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      throw new ErrorResponse(400, 'Độ ưu tiên không hợp lệ');
    }

    // Validate complexity: nếu có thì phải là một trong các giá trị hợp lệ
    if (complexity && !['easy', 'medium', 'complex', 'veryComplex'].includes(complexity)) {
      throw new ErrorResponse(400, 'Mức độ phức tạp không hợp lệ');
    }

    // Validate status: nếu có thì phải là một trong các giá trị hợp lệ
    if (status && !['Open', 'To do', 'In progress', 'Reviewing', 'Done', 'Cancel'].includes(status)) {
      throw new ErrorResponse(400, 'Trạng thái không hợp lệ');
    }

    // Tìm student record từ userId
    const StudentModel = require('../models/student-model');
    const student = await StudentModel.findOne({ user: userId });

    // Kiểm tra student có tồn tại không
    if (!student) {
      throw new ErrorResponse(404, 'Không tìm thấy thông tin student');
    }

    // Tạo task mới với createdBy là chính student đó
    const task = await TaskModel.create({
      taskTitle: taskTitle.trim(),                    // Tiêu đề đã trim
      description: description?.trim() || '',          // Mô tả (nếu có) hoặc chuỗi rỗng
      startDate: start,                               // Ngày bắt đầu
      dueDate: due,                                  // Ngày hết hạn
      priority: priority || 'medium',                 // Độ ưu tiên (mặc định: medium)
      complexity: complexity || 'medium',             // Mức độ phức tạp (mặc định: medium)
      status: status || 'Open',                       // Trạng thái (mặc định: Open)
      createdBy: userId,                              // ID của student tạo task
    });

    // Tự động gán task cho chính student đó
    await TaskAssignmentModel.create({
      task: task._id,                    // ID của task vừa tạo
      student: student._id,              // ID của student
      progressStatus: 'notStarted',      // Trạng thái tiến độ mặc định: chưa bắt đầu
    });

    // Trả về kết quả thành công
    return res.status(201).json({
      message: 'Tạo task thành công',
      task,
    });
  } catch (error) {
    // Nếu lỗi là ErrorResponse, throw lại
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Log lỗi và throw ErrorResponse mới
    console.error('Error in createMyTask:', error);
    throw new ErrorResponse(500, 'Lỗi khi tạo task');
  }
};

