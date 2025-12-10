const mongoose = require('mongoose');
const { Schema } = mongoose;

const criterionScoreSchema = new Schema(
  {
    criterionId: {
      type: Schema.Types.ObjectId,
      ref: 'EvaluationCriteria',
      required: true,
    },
    criterionName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const evaluationSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    criteriaScores: [criterionScoreSchema],
    totalScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'submitted'],
      default: 'draft',
    },
    submittedDate: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedDate: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

evaluationSchema.index({ student: 1, mentor: 1, createdAt: -1 });
evaluationSchema.index({ status: 1, submittedDate: -1 });

module.exports = mongoose.model('Evaluation', evaluationSchema, 'Evaluations');

