// models/lab-attendance-model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const labAttendanceSchema = new Schema(
  {
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    
    },
    checkInTime: Date,
    checkOutTime: Date,

    // Log OJT
    workSummary: {
      type: String,
      trim: true,
    },
    workDetails: {
      type: String,
      trim: true,
    },

    totalHours: {
      type: Number,
      default: 0,
    },
    Status: {
      type: String,
      enum: [
        'inProgress',  // đang trong giờ lab
        'completed',   // checkin + checkout
        'late',        // chỉ checkout (đến trễ)
        'incomplete',  // checkin nhưng không checkout
        'absent',      // không tham gia
      ],
      default: 'inProgress',
    },
  },
  { timestamps: true, versionKey: false }
);

// 1 student - 1 lab - 1 ngày = 1 record
labAttendanceSchema.index({ lab: 1, student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model(
  'LabAttendance',
  labAttendanceSchema,
  'LabAttendances'
);
