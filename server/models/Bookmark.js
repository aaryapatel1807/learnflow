const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['book', 'chapter', 'topic', 'flashcard', 'roadmapNode', 'resource']
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user + content queries and uniqueness
bookmarkSchema.index({ userId: 1, contentType: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
