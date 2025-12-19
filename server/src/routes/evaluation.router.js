const express = require('express');
const router = express.Router();
const evalController = require('../controllers/evaluation.controller');
const verifyAccessToken = require('../middlewares/verify-token-middleware');

// Tất cả các route yêu cầu đăng nhập
router.use(verifyAccessToken);

// --- ROUTES CHO MENTOR ---

/**
 * @route   GET /api/evaluation/lab/students
 * @desc    Lấy danh sách sinh viên của Lab mà Mentor đang quản lý
 */
router.get('/lab/students', evalController.getStudentsByLab);

/**
 * @route   GET /api/evaluation/preview/:labId/:studentId
 * @desc    Lấy thống kê chuyên cần và điểm đề xuất cho Modal chấm điểm
 */
router.get('/preview/:labId/:studentId', evalController.getEvaluationPreview);

/**
 * @route   POST /api/evaluation
 * @desc    Lưu bản đánh giá mới từ Mentor
 */
router.post('/', evalController.createEvaluation);


// --- ROUTES CHO ADMIN ---

/**
 * @route   GET /api/evaluation/admin/list
 * @desc    Admin lấy danh sách tất cả đánh giá (hỗ trợ query ?labId=...)
 */
router.get('/admin/list', evalController.getAdminEvaluations);

/**
 * @route   GET /api/evaluation/admin/lab/:labId
 * @desc    Admin xem chi tiết toàn bộ đánh giá của một Lab cụ thể
 */
router.get('/admin/lab/:labId', evalController.getAllEvaluationsByLab);

module.exports = router;