const mongoose = require('mongoose');

const skillNodeSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  prerequisiteSkillNodeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillNode'
  }],
  // Linked content
  contentType: {
    type: String,
    enum: ['chapter', 'topic', 'none'],
    default: 'none'
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  topic: {
    type: String,
    trim: true
  },
  // Visual positioning (optional, for UI layout)
  order: {
    type: Number,
    default: 0
  },
  layer: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient subject-based queries
skillNodeSchema.index({ subject: 1, order: 1 });

module.exports = mongoose.model('SkillNode', skillNodeSchema);
