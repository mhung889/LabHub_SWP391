// models/student-model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
    studentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    major: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Major" 
    },

    startDate: {
      type:String,
      required: true
    },
    // 1 student chọn 1 lab
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
    },
    labStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected', 'inactive'],
      default: 'none',
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Student', studentSchema, 'Students');
