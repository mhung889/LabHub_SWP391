const axios = require("axios");
const User = require("../models/user-model");
const Student = require("../models/student-model");
const LabAttendance = require("../models/lab-attendance-model");
const Lab = require("../models/lab-model");
const {
  isCheckInAllowed,
  isCheckOutAllowed,
} = require("../helpers/attendance-time.helper");
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
async function compareFaces(token1, token2) {
  const url = "https://api-us.faceplusplus.com/facepp/v3/compare";

  const formData = new URLSearchParams();
  formData.append("api_key", process.env.FACE_API_KEY);
  formData.append("api_secret", process.env.FACE_API_SECRET);
  formData.append("face_token1", token1);
  formData.append("face_token2", token2);

  const res = await axios.post(url, formData);
  return res.data.confidence;
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
// CHECKIN BY FACE
// ===============================================
exports.checkin = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) throw new ErrorResponse(400, "Thiếu ảnh check-in");

    const user = await User.findById(req.user._id);
    if (!user.faceToken)
      throw new ErrorResponse(400, "Bạn chưa đăng ký khuôn mặt");

    const student = await Student.findOne({ user: user._id });
    if (!student) throw new ErrorResponse(404, "Không tìm thấy student");
    if (!student.lab)
      throw new ErrorResponse(400, "Bạn chưa được gán lab");

    // ===== LẤY LAB =====
    const lab = await Lab.findById(student.lab);
    if (!lab) throw new ErrorResponse(404, "Lab không tồn tại");

    if (lab.status !== "active") {
      throw new ErrorResponse(400, "Lab hiện không hoạt động");
    }

    // ===== CHECK TIME RULE =====
    if (!isCheckInAllowed(lab)) {
      throw new ErrorResponse(
        400,
        "Chưa đến thời gian cho phép check-in"
      );
    }

    // ===== FACE DETECT =====
    const faceTokenCheck = await detectFace(imageBase64);
    if (!faceTokenCheck)
      throw new ErrorResponse(400, "Không nhận diện được khuôn mặt");

    const confidence = await compareFaces(user.faceToken, faceTokenCheck);
    if (confidence < 75)
      throw new ErrorResponse(400, "Khuôn mặt không khớp");

    // ===== ATTENDANCE RECORD =====
    const today = new Date();
    const dateOnly = new Date(today.toISOString().split("T")[0]);

    let attendance = await LabAttendance.findOne({
      student: student._id,
      lab: student.lab,
      date: dateOnly,
    });

    if (attendance && attendance.checkInTime) {
      return res
        .status(400)
        .json({ message: "Bạn đã check-in hôm nay rồi" });
    }

    if (!attendance) {
      attendance = await LabAttendance.create({
        student: student._id,
        lab: student.lab,
        date: dateOnly,
        checkInTime: new Date(),
        status: "inProgress",
        checkInConfidence: confidence,
      });
    }

    return res.json({
      message: "Check-in thành công",
      attendance,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message });
  }
};

// ===============================================
// CHECKOUT BY FACE
// ===============================================
exports.checkout = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) throw new ErrorResponse(400, "Thiếu ảnh checkout");

    const user = await User.findById(req.user._id);
    if (!user.faceToken)
      throw new ErrorResponse(400, "Bạn chưa đăng ký khuôn mặt");

    const student = await Student.findOne({ user: user._id });
    if (!student) throw new ErrorResponse(404, "Không tìm thấy student");
    if (!student.lab)
      throw new ErrorResponse(400, "Bạn chưa được gán lab");

    // ===== LẤY LAB =====
    const lab = await Lab.findById(student.lab);
    if (!lab) throw new ErrorResponse(404, "Lab không tồn tại");

    if (lab.status !== "active") {
      throw new ErrorResponse(400, "Lab hiện không hoạt động");
    }

    // ===== CHECK TIME RULE =====
    if (!isCheckOutAllowed(lab)) {
      throw new ErrorResponse(
        400,
        "Chưa đến thời gian cho phép check-out"
      );
    }

    // ===== FIND ATTENDANCE =====
    const today = new Date();
    const dateOnly = new Date(today.toISOString().split("T")[0]);

    const attendance = await LabAttendance.findOne({
      student: student._id,
      lab: student.lab,
      date: dateOnly,
    });

    if (!attendance || !attendance.checkInTime) {
      throw new ErrorResponse(400, "Bạn chưa check-in hôm nay");
    }

    if (attendance.checkOutTime) {
      throw new ErrorResponse(400, "Bạn đã check-out hôm nay");
    }

    // ===== FACE DETECT =====
    const faceTokenCheck = await detectFace(imageBase64);
    if (!faceTokenCheck)
      throw new ErrorResponse(400, "Không nhận diện được khuôn mặt");

    const confidence = await compareFaces(user.faceToken, faceTokenCheck);
    if (confidence < 75)
      throw new ErrorResponse(400, "Khuôn mặt không khớp");

    attendance.checkOutTime = new Date();
    attendance.checkOutConfidence = confidence;
    attendance.status = "completed";

    await attendance.save();

    return res.json({
      message: "Check-out thành công",
      attendance,
    });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message });
  }
};


