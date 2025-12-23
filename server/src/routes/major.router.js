// Import Express để tạo router
const express = require("express");
// Import middleware xác thực token
const verifyToken = require('../middlewares/verify-token-middleware');
// Import middleware xử lý async errors
const asyncMiddleware = require('../middlewares/async.middleware');
// Import middleware kiểm tra role
const roleMiddleware = require('../middlewares/role.middleware');
// Import controller functions từ major.controller
const majorController = require("../controllers/major.controller");

// Tạo Express router
const router = express.Router();

// Route public - lấy danh sách tất cả chuyên ngành (dùng cho dropdown, etc.)
router.get("/", asyncMiddleware(majorController.getAllMajors));

// Route public - tìm kiếm chuyên ngành
router.get("/search", asyncMiddleware(majorController.searchMajors));

// Route admin - lấy thông tin chuyên ngành theo ID (yêu cầu authentication và role admin)
router.get(
  "/:id",
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('admin'),            // Middleware kiểm tra role là admin
  asyncMiddleware(majorController.getMajorById)  // Controller xử lý logic
);

// Route admin - tạo chuyên ngành mới (yêu cầu authentication và role admin)
router.post(
  "/",
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('admin'),            // Middleware kiểm tra role là admin
  asyncMiddleware(majorController.createMajor)   // Controller xử lý logic
);

// Route admin - cập nhật chuyên ngành (yêu cầu authentication và role admin)
router.patch(
  "/:id",
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('admin'),            // Middleware kiểm tra role là admin
  asyncMiddleware(majorController.updateMajor)    // Controller xử lý logic
);

// Route admin - xóa chuyên ngành (yêu cầu authentication và role admin)
router.delete(
  "/:id",
  asyncMiddleware(verifyToken),        // Middleware xác thực token
  roleMiddleware('admin'),            // Middleware kiểm tra role là admin
  asyncMiddleware(majorController.deleteMajor)    // Controller xử lý logic
);

// Export router để sử dụng trong app.js
module.exports = router;
