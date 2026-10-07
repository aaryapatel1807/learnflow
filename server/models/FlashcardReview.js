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
    default: 0, // legacy field (pre-SM-2); kept for backward compatibility
    min: 0
  },
  // SM-2 scheduling state (Anki-style)
  easiness: {
    type: Number,
    default: 2.5, // SM-2 easiness factor, floored at 1.3
    min: 1.3
  },
  interval: {
    type: Number,
    default: 0, // current interval in days
    min: 0
  },
  repetitions: {
    type: Number,
    default: 0, // consecutive successful recalls (q >= 3)
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
