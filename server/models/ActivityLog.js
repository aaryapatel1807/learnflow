const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  count: {
    type: Number,
    required: true,
    default: 1
  }
}, {
  timestamps: true
});

// Compound unique index to ensure one entry per user per day
activityLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Helper method to increment activity for a user on a given date
activityLogSchema.statics.incrementActivity = async function(userId, date = new Date()) {
  // Normalize date to start of day (midnight UTC)
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  try {
    const result = await this.findOneAndUpdate(
      { userId, date: normalizedDate },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    return result;
  } catch (error) {
    console.error('Error incrementing activity log:', error);
    throw error;
  }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
