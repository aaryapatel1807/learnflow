const mongoose = require('mongoose');

const learningPathNodeSchema = new mongoose.Schema({
  learningPath: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: true
  },
  prerequisiteNodeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPathNode'
  }],
  // Link to Phase 1 content
  contentType: {
    type: String,
    enum: ['book', 'chapter'],
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }
}, {
  timestamps: true
});

// Ensure order is unique within a learning path
learningPathNodeSchema.index({ learningPath: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('LearningPathNode', learningPathNodeSchema);
