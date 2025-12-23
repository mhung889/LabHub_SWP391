// Import Express để tạo router
const express = require('express');
// Import middleware xác thực token
const verifyToken = require('../middlewares/verify-token-middleware');
// Import middleware xử lý async errors
const asyncMiddleware = require('../middlewares/async.middleware');
// Import middleware kiểm tra role
const roleMiddleware = require('../middlewares/role.middleware');
// Import middleware upload file
const upload = require('../middlewares/upload.middleware');

// Import các controller functions từ mentor.controller
const {
  getMentors,              // Lấy danh sách mentor
  getMentorById,           // Lấy thông tin mentor theo ID
  createMentor,            // Tạo mentor mới
  updateMentor,            // Cập nhật thông tin mentor
  searchMentors,           // Tìm kiếm mentor
  getMentorAttendance,     // Lấy dữ liệu điểm danh của mentor
  updateCheckInTime,       // Cập nhật thời gian check-in
  updateCheckOutTime,      // Cập nhật thời gian check-out
} = require('../controllers/mentor.controller');

// Tạo Express router
const router = express.Router();

// Route test để kiểm tra router hoạt động
router.get('/test', (req, res) => {
  res.json({ message: 'Mentor router is working!' });
});

// Route tìm kiếm mentor (public, không cần authentication)
router.get('/search', asyncMiddleware(searchMentors));

// Route lấy dữ liệu điểm danh của mentor (yêu cầu authentication và role mentor)
router.get(
  '/attendance',
  asyncMiddleware(verifyToken),      // Middleware xác thực token
  roleMiddleware('mentor'),          // Middleware kiểm tra role là mentor
  asyncMiddleware(getMentorAttendance) // Controller xử lý logic
);

// Route cập nhật thời gian check-in (yêu cầu authentication và role mentor)
router.patch(
  '/attendance/:id/checkin-time',
  verifyToken,                        // Middleware xác thực token
  roleMiddleware('mentor'),          // Middleware kiểm tra role là mentor
  asyncMiddleware(updateCheckInTime)  // Controller xử lý logic
);

// Route cập nhật thời gian check-out (yêu cầu authentication và role mentor)
router.patch(
  '/attendance/:id/checkout-time',
  verifyToken,                        // Middleware xác thực token
  roleMiddleware('mentor'),          // Middleware kiểm tra role là mentor
  asyncMiddleware(updateCheckOutTime) // Controller xử lý logic
);

// Route lấy danh sách mentor (public, không cần authentication)
router.get('/', asyncMiddleware(getMentors));

// Route lấy thông tin mentor theo ID (public, không cần authentication)
router.get('/:id', asyncMiddleware(getMentorById));

// Route tạo mentor mới (public, có upload file ảnh)
router.post('/', upload.single('image'), asyncMiddleware(createMentor));

// Route cập nhật mentor (public, có upload file ảnh)
router.patch('/:id', upload.single('image'), asyncMiddleware(updateMentor));

// router.get(
//   '/search',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   asyncMiddleware(searchMentors)
// );

// router.get(
//   '/',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   asyncMiddleware(getMentors)
// );

// router.get(
//   '/:id',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   asyncMiddleware(getMentorById)
// );

// router.post(
//   '/',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   upload.single('image'),
//   asyncMiddleware(createMentor)
// );

// router.patch(
//   '/:id',
//   asyncMiddleware(verifyToken),
//   roleMiddleware('admin'),
//   upload.single('image'),
//   asyncMiddleware(updateMentor)
// );

module.exports = router;
