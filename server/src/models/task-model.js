const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    taskTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    complexity: {
      type: String,
      enum: ['easy', 'medium', 'complex', 'veryComplex'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['Open', 'To do', 'In progress', 'Reviewing', 'Done', 'Cancel'],
      default: 'Open',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

taskSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema, 'Tasks');

