const mongoose = require('mongoose');
const { Schema } = mongoose;

const evaluationCriteriaSchema = new Schema(
  {
    criterionName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true, versionKey: false }
);

evaluationCriteriaSchema.index({ isActive: 1, version: -1 });

module.exports = mongoose.model('EvaluationCriteria', evaluationCriteriaSchema, 'EvaluationCriterias');

