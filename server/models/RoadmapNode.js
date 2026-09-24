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
  },
  // Tree structure: which node this branches off of (null/undefined = top-level spine node)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoadmapNode',
    default: null
  },
  // 'milestone' = big spine node (like roadmap.sh's Internet/HTML/CSS column)
  // 'topic'     = branching sub-topic pill (like "What is HTTP?")
  // 'optional'  = branching sub-topic, dashed/muted styling
  nodeType: {
    type: String,
    enum: ['milestone', 'topic', 'optional'],
    default: 'milestone'
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'done'],
    default: 'not-started'
  }
}, {
  timestamps: true
});

// Ensure order is unique within a roadmap
roadmapNodeSchema.index({ roadmap: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('RoadmapNode', roadmapNodeSchema);
