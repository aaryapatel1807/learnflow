const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementKey: {
    type: String,
    required: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one achievement unlock per user per achievement
userAchievementSchema.index({ user: 1, achievementKey: 1 }, { unique: true });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
