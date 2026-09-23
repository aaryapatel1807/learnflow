const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  lastPageRead: {
    type: Number,
    default: 1
  },
  isChapterComplete: {
    type: Boolean,
    default: false
  },
  completedChapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }]
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user per book
progressSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
