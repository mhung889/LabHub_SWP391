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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    address: {
      type: String,
    },
    studentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    className: {
      type: String,
      trim: true,
    },
    major: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default:
        'https://res.cloudinary.com/dyz2xtks9/image/upload/v1741075645/Human%20Management/images/user_default_1741075643141.jpg',
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },

    //  1 student chọn 1 lab
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
    },
    // Trạng thái tham gia lab
    labStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected', 'inactive'],
      default: 'none',
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Student', studentSchema, 'Students');
