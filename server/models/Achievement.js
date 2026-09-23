const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  criteriaType: {
    type: String,
    required: true,
    enum: [
      'chapters_completed',
      'books_completed',
      'streak_days',
      'flashcard_reviews',
      'xp_earned',
      'high_score_quizzes',
      'learning_paths_completed'
    ]
  },
  criteriaValue: {
    type: Number,
    required: true,
    default: 1
  },
  icon: {
    type: String,
    default: '🏆'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Achievement', achievementSchema);
