const mongoose = require('mongoose');
const { Schema } = mongoose;

const evaluationSchema = new Schema(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Người thực hiện đánh giá
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student', // Sinh viên được đánh giá
      required: true,
    },
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Lab', // Phòng lab diễn ra đánh giá
      required: true,
    },
    // Lưu lại trạng thái điểm danh tại thời điểm đánh giá
    attendanceSnapshot: {
      absentCount: { type: Number, default: 0 },
      leaveCount: { type: Number, default: 0 },
      partialCount: { type: Number, default: 0 },
    },
    suggestedScore: {
      type: Number, // Điểm do hệ thống tự tính (max 10)
    },
    finalScore: {
      type: Number, // Điểm do Mentor quyết định nhập vào
      required: true,
      min: 0,
      max: 10,
    },
    content: {
      type: String, // Nhận xét bằng chữ
      required: true,
      trim: true,
    },
    evaluationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

// Đảm bảo 1 kỳ đánh giá (ví dụ theo tháng hoặc theo kỳ) 
// Nếu bạn muốn 1 lab - 1 student chỉ có 1 bản đánh giá duy nhất:
evaluationSchema.index({ lab: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Evaluation', evaluationSchema, 'Evaluations');