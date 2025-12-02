// // models/lab-recruitment-model.js
// // tạo bài đăng tuyển student vào lab
// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const labRecruitmentSchema = new Schema(
//   {
//     lab: {
//       type: Schema.Types.ObjectId,
//       ref: 'Lab',
//       required: true,
//     },
//     createdBy: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',      // mentor
//       required: true,
//     },
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String, // mô tả chung về lab + công việc
//       required: true,
//     },
//     requirements: {
//       type: String, // yêu cầu kỹ năng
//       trim: true,
//     },
//     slots: {
//       type: Number, // số lượng cần tuyển
//     },
//     deadline: {
//       type: Date,
//     },
//     status: {
//       type: String,
//       enum: ['open', 'closed'],
//       default: 'open',
//     },
//   },
//   { timestamps: true, versionKey: false }
// );

// module.exports = mongoose.model(
//   'LabRecruitment',
//   labRecruitmentSchema,
//   'LabRecruitments'
// );
