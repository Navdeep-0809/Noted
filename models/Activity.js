// models/Activity.js
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'deleted', 'logged in', 'registered'],
    },
    entityType: {
      type: String,
      enum: ['Note', 'User'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
    },
  },
  {
    timestamps: true, // adds createdAt (used for activity time)
  }
);

module.exports = mongoose.model('Activity', activitySchema);
