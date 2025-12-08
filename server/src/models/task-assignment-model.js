const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskAssignmentSchema = new Schema(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    progressStatus: {
      type: String,
      enum: ['notStarted', 'inProgress', 'completed'],
      default: 'notStarted',
    },
    progressNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    submissionFile: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

taskAssignmentSchema.index({ task: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('TaskAssignment', taskAssignmentSchema, 'TaskAssignments');

