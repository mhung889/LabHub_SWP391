// models/leave-request-model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const leaveRequestSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['sick', 'personal', 'schoolActivity', 'other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approver: {
      type: Schema.Types.ObjectId,
      ref: 'User', // mentor của lab
    },
    approvedAt: Date,
    note: String,
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model(
  'LeaveRequest',
  leaveRequestSchema,
  'LeaveRequests'
);
