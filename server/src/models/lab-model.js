// models/lab-model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const labSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  

    //  1 lab có 1 mentor phụ trách
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User', // role = mentor
    },

    //  Khung giờ làm việc 
    startTime: {
      type: String, // '08:00'
      trim: true,
    },
    endTime: {
      type: String, // '17:00'
      trim: true,
    },

    total: {
      type:Number,
      required: true,
      default: 30
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Lab', labSchema, 'Labs');
