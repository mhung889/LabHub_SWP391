const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");

// 🔥 bạn import verifyAccessToken
const verifyAccessToken = require("../middlewares/verify-token-middleware");

// 🔥 bạn cần dùng verifyAccessToken ở dưới

router.get("/check-face", verifyAccessToken, attendanceController.checkFaceStatus);

router.post("/register-face", verifyAccessToken, attendanceController.registerFace);

router.post("/checkin", verifyAccessToken, attendanceController.checkin);

router.post("/checkout", verifyAccessToken, attendanceController.checkout);

module.exports = router;
