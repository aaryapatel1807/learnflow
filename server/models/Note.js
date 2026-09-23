const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['chapter', 'topic']
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user + content queries
noteSchema.index({ userId: 1, contentType: 1, contentId: 1 });

module.exports = mongoose.model('Note', noteSchema);
