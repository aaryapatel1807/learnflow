const mongoose = require('mongoose');

const flashcardReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flashcard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flashcard',
    required: true
  },
  lastReviewed: {
    type: Date,
    default: null
  },
  nextReview: {
    type: Date,
    default: Date.now
  },
  difficulty: {
    type: Number,
    default: 0, // 0 = new, increases with successful reviews
    min: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure one review record per user per flashcard
flashcardReviewSchema.index({ user: 1, flashcard: 1 }, { unique: true });

module.exports = mongoose.model('FlashcardReview', flashcardReviewSchema);
