const mongoose = require('mongoose');

// Per-user learning status for a roadmap node. Status used to live on the
// RoadmapNode document itself, so one user's "done" was shown to everyone.
const roadmapNodeStatusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  node: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapNode', required: true },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'done', 'skipped'],
    default: 'not-started'
  }
}, { timestamps: true });

roadmapNodeStatusSchema.index({ user: 1, node: 1 }, { unique: true });

module.exports = mongoose.model('RoadmapNodeStatus', roadmapNodeStatusSchema);
