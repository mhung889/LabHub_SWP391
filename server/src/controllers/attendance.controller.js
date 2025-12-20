const axios = require("axios");
const User = require("../models/user-model");
const Student = require("../models/student-model");
const LabAttendance = require("../models/lab-attendance-model");
const Lab = require("../models/lab-model");
const {
  isCheckInAllowed,
  isCheckOutAllowed,
} = require("../helpers/attendance-time.helper");
const { getVNDateOnly } = require("../helpers/vn-date.helper");
const ErrorResponse = require("../helpers/ErrorResponse");

// ===============================================
// Helper: Detect Face => return face_token
// ===============================================
async function detectFace(imageBase64) {
  const url = "https://api-us.faceplusplus.com/facepp/v3/detect";

  const formData = new URLSearchParams();
  formData.append("api_key", process.env.FACE_API_KEY);
  formData.append("api_secret", process.env.FACE_API_SECRET);
  formData.append("image_base64", imageBase64);

  const res = await axios.post(url, formData);
  if (!res.data.faces || res.data.faces.length === 0) return null;

  return res.data.faces[0].face_token;
}

// ===============================================
// Helper: Compare faces
// ===============================================
// async function compareFaces(token1, token2) {
//   const url = "https://api-us.faceplusplus.com/facepp/v3/compare";

//   const formData = new URLSearchParams();
//   formData.append("api_key", process.env.FACE_API_KEY);
//   formData.append("api_secret", process.env.FACE_API_SECRET);
//   formData.append("face_token1", token1);
//   formData.append("face_token2", token2);

//   const res = await axios.post(url, formData);
//   return res.data.confidence;
// }
async function compareFaces(token1, token2) {
  const url = "https://api-us.faceplusplus.com/facepp/v3/compare";

  const formData = new URLSearchParams();
  formData.append("api_key", process.env.FACE_API_KEY);
  formData.append("api_secret", process.env.FACE_API_SECRET);
  formData.append("face_token1", token1);
  formData.append("face_token2", token2);

  try {
    const res = await axios.post(url, formData);
    return res.data.confidence;
  } catch (err) {
    console.error("❌ FACE++ COMPARE ERROR");
    console.error("STATUS:", err.response?.status);
    console.error("DATA:", err.response?.data);
    throw err;
  }
}


exports.checkFaceStatus = async (req, res) => {
  try {
    const user = req.user; // từ middleware verify token

    if (!user.faceToken) {
      return res.json({
        registered: false,
        message: "User chưa đăng ký khuôn mặt."
      });
    }

    return res.json({
      registered: true,
      faceToken: user.faceToken
    });

  } catch (err) {
    console.error("Error checkFaceStatus:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};


// ===============================================
// REGISTER FACE
// ===============================================
exports.registerFace = async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) throw new ErrorResponse(400, "Thiếu ảnh đăng ký");

    const user = await User.findById(req.user._id);
    if (!user) throw new ErrorResponse(404, "Không tìm thấy user");

    // Detect face
    const faceToken = await detectFace(imageBase64);
    if (!faceToken) throw new ErrorResponse(400, "Không nhận diện được khuôn mặt");

    // Lưu vào DB
    user.faceToken = faceToken;
    await user.save();

    return res.json({
      message: "Đăng ký khuôn mặt thành công",
      faceToken,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// ===============================================
// CHECKIN (FACE + MANUAL)
// ===============================================
exports.checkin = async (req, res) => {
  try {
    const { imageBase64, method = "face" } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) throw new ErrorResponse(404, "Không tìm thấy user");

    const student = await Student.findOne({ user: user._id });
    if (!student || !student.lab)
      throw new ErrorResponse(400, "Chưa được gán lab");

    const lab = await Lab.findById(student.lab);
    if (!lab || lab.status !== "active")
      throw new ErrorResponse(400, "Lab không hoạt động");

    if (!isCheckInAllowed(lab))
      throw new ErrorResponse(400, "Chưa tới giờ check-in");

    // ===============================
    // FACE CHECK-IN
    // ===============================
    if (method === "face") {
      if (!imageBase64)
        throw new ErrorResponse(400, "Thiếu ảnh");

      if (!user.faceToken)
        throw new ErrorResponse(400, "Chưa đăng ký khuôn mặt");

      const faceTokenCheck = await detectFace(imageBase64);
      if (!faceTokenCheck)
        throw new ErrorResponse(400, "Không nhận diện được khuôn mặt");

      const confidence = await compareFaces(
        user.faceToken,
        faceTokenCheck
      );

      if (confidence < 75)
        throw new ErrorResponse(400, "Khuôn mặt không khớp");
    }

    // ===============================
    // COMMON LOGIC
    // ===============================
    const dateVN = getVNDateOnly();

    const attendance = await LabAttendance.findOne({
      student: student._id,
      lab: student.lab,
      date: dateVN,
    });

    if (!attendance)
      throw new ErrorResponse(500, "Attendance chưa được khởi tạo");

    if (attendance.checkInTime)
      throw new ErrorResponse(400, "Đã check-in");

    attendance.checkInTime = new Date();
    await attendance.save();

    return res.json({
      message:
        method === "manual"
          ? "Check-in thành công (manual)"
          : "Check-in thành công",
      checkInTime: attendance.checkInTime,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message });
  }
};

// ===============================================
// CHECKOUT (FACE + MANUAL)
// ===============================================
exports.checkout = async (req, res) => {
  try {
    const { imageBase64, method = "face" } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) throw new ErrorResponse(404, "Không tìm thấy user");

    const student = await Student.findOne({ user: user._id });
    if (!student || !student.lab)
      throw new ErrorResponse(400, "Chưa được gán lab");

    const lab = await Lab.findById(student.lab);
    if (!lab || lab.status !== "active")
      throw new ErrorResponse(400, "Lab không hoạt động");

    if (!isCheckOutAllowed(lab))
      throw new ErrorResponse(400, "Chưa tới giờ check-out");

    // ===============================
    // FACE CHECK-OUT
    // ===============================
    if (method === "face") {
      if (!imageBase64)
        throw new ErrorResponse(400, "Thiếu ảnh");

      if (!user.faceToken)
        throw new ErrorResponse(400, "Chưa đăng ký khuôn mặt");

      const faceTokenCheck = await detectFace(imageBase64);
      if (!faceTokenCheck)
        throw new ErrorResponse(400, "Không nhận diện được khuôn mặt");

      const confidence = await compareFaces(
        user.faceToken,
        faceTokenCheck
      );

      if (confidence < 75)
        throw new ErrorResponse(400, "Khuôn mặt không khớp");
    }

    // ===============================
    // COMMON LOGIC
    // ===============================
    const dateVN = getVNDateOnly();

    const attendance = await LabAttendance.findOne({
      student: student._id,
      lab: student.lab,
      date: dateVN,
    });

    if (!attendance || !attendance.checkInTime)
      throw new ErrorResponse(
        400,
        "Chưa check-in, không thể check-out"
      );

    if (attendance.checkOutTime)
      throw new ErrorResponse(400, "Đã check-out");

    attendance.checkOutTime = new Date();
    await attendance.save();

    return res.json({
      message:
        method === "manual"
          ? "Check-out thành công (manual)"
          : "Check-out thành công",
      checkOutTime: attendance.checkOutTime,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message });
  }
};




