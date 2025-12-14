// models/notification-model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User', // mentor
      required: true,
    },
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
      required: true, // gửi cho cả lab
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'archived',],
      default: 'active',
    },
    // readBy: [
    //   {
    //     student: {
    //       type: Schema.Types.ObjectId,
    //       ref: 'Student',
    //     },
    //     readAt: {
    //       type: Date,
    //       default: Date.now,
    //     },
    //   },
    // ],
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ lab: 1, createdAt: -1 });

module.exports = mongoose.model(
  'Notification',
  notificationSchema,
  'Notifications'
);
