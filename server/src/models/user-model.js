// models/user-model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const emergencyContactSchema = new Schema(
  {
    name: String,
    relationship: String,
    phoneNumber: String,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },

    // role chung
    role: {
      type: String,
      enum: ['admin', 'mentor', 'student'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    //  Các thông tin dùng chung cho mọi user (mentor / student)
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
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
    emergencyContact: emergencyContactSchema,
    // For password reset flow
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('User', userSchema, 'Users');
