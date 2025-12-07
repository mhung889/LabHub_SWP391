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
    startTime: {
      type: String, // '08:00'
      trim: true,
    },
    endTime: {
      type: String, // '17:00'
      trim: true,
    },
    total: {
      type: Number,
      required: true,
      default: 30,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    major: {
      type: Schema.Types.ObjectId,
      ref: 'Major',
      default: null,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User', // role = mentor
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// count student in lab
labSchema.virtual('enrolled', {
  ref: 'Student', // model Student
  localField: '_id', // lab._id
  foreignField: 'lab', // Student.lab
  count: true, 
});

module.exports = mongoose.model('Lab', labSchema, 'Labs');
