// models/user-model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

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
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('User', userSchema, 'Users');
