// Import Express để tạo router
const express = require('express');
// Import middleware xác thực token
const verifyToken = require('../middlewares/verify-token-middleware');
// Import middleware xử lý async errors
const asyncMiddleware = require('../middlewares/async.middleware');
// Import middleware kiểm tra role
const roleMiddleware = require('../middlewares/role.middleware');
// Import controller functions từ task.controller
const taskController = require('../controllers/task.controller');

// Tạo Express router
const router = express.Router();

// =====================================
// MENTOR ROUTES - Quản lý task của mentor
// =====================================

// Route lấy danh sách task của mentor (yêu cầu authentication và role mentor)
router.get(
  '/',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('mentor'),           // Middleware kiểm tra role là mentor
  asyncMiddleware(taskController.getTasks)  // Controller xử lý logic
);

// Route lấy thông tin task theo ID (yêu cầu authentication và role mentor)
router.get(
  '/:id',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('mentor'),           // Middleware kiểm tra role là mentor
  asyncMiddleware(taskController.getTaskById)  // Controller xử lý logic
);

// Route tạo task mới (yêu cầu authentication và role mentor)
router.post(
  '/',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('mentor'),           // Middleware kiểm tra role là mentor
  asyncMiddleware(taskController.createTask)  // Controller xử lý logic
);

// Route cập nhật task (yêu cầu authentication và role mentor)
router.patch(
  '/:id',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('mentor'),           // Middleware kiểm tra role là mentor
  asyncMiddleware(taskController.updateTask)  // Controller xử lý logic
);

// Route gán task cho student (yêu cầu authentication và role mentor)
router.post(
  '/:id/assign',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('mentor'),           // Middleware kiểm tra role là mentor
  asyncMiddleware(taskController.assignTask)  // Controller xử lý logic
);

// Route lấy danh sách student có thể gán cho task (yêu cầu authentication và role mentor)
router.get(
  '/:id/students',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('mentor'),           // Middleware kiểm tra role là mentor
  asyncMiddleware(taskController.getAssignedStudents)  // Controller xử lý logic
);

// Route xóa task (yêu cầu authentication và role mentor)
router.delete(
  '/:id',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('mentor'),           // Middleware kiểm tra role là mentor
  asyncMiddleware(taskController.deleteTask)  // Controller xử lý logic
);

// =====================================
// STUDENT ROUTES - Quản lý task của student
// =====================================

// Route lấy danh sách task của student (yêu cầu authentication và role student)
router.get(
  '/student/my-tasks',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('student'),          // Middleware kiểm tra role là student
  asyncMiddleware(taskController.getMyTasks)  // Controller xử lý logic
);

// Route lấy thông tin task theo ID của student (yêu cầu authentication và role student)
router.get(
  '/student/my-tasks/:id',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('student'),          // Middleware kiểm tra role là student
  asyncMiddleware(taskController.getMyTaskById)  // Controller xử lý logic
);

// Route cập nhật tiến độ task của student (yêu cầu authentication và role student)
router.patch(
  '/student/my-tasks/:id/progress',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('student'),          // Middleware kiểm tra role là student
  asyncMiddleware(taskController.updateMyTaskProgress)  // Controller xử lý logic
);

// Route tạo task mới của student (yêu cầu authentication và role student)
router.post(
  '/student/my-tasks',
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('student'),          // Middleware kiểm tra role là student
  asyncMiddleware(taskController.createMyTask)  // Controller xử lý logic
);

// Export router để sử dụng trong app.js
module.exports = router;

