const mongoose = require('mongoose');

const roadmapNodeSchema = new mongoose.Schema({
  roadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
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
  phase: {
    type: String,
    default: ''
  },
  // Link to Learning Path (higher level than learning path nodes)
  learningPath: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath'
  },
  // Milestone info
  milestone: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure order is unique within a roadmap
roadmapNodeSchema.index({ roadmap: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('RoadmapNode', roadmapNodeSchema);
