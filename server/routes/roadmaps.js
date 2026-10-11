const express = require('express');
const Roadmap = require('../models/Roadmap');
const RoadmapNode = require('../models/RoadmapNode');
const RoadmapNodeStatus = require('../models/RoadmapNodeStatus');

const router = express.Router();

// Get all roadmaps
router.get('/', async (req, res) => {
  try {
    const roadmaps = await Roadmap.find();
    
    // Add node count to each roadmap
    const roadmapsWithDetails = await Promise.all(
      roadmaps.map(async (roadmap) => {
        const nodeCount = await RoadmapNode.countDocuments({ roadmap: roadmap._id });
        return {
          ...roadmap.toObject(),
          nodeCount
        };
      })
    );

    res.json(roadmapsWithDetails);
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single roadmap with all nodes
router.get('/:id', async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // Get all nodes for this roadmap
    const nodes = await RoadmapNode.find({ roadmap: req.params.id })
      .populate('learningPath', 'title description difficulty')
      .sort('order');

    // Overlay this user's own status on each node (status is per user, not global).
    const statuses = await RoadmapNodeStatus.find({
      user: req.user.id,
      node: { $in: nodes.map(n => n._id) }
    }).lean();
    const statusByNode = new Map(statuses.map(s => [s.node.toString(), s.status]));

    res.json({
      ...roadmap.toObject(),
      nodes: nodes.map(n => ({
        ...n.toObject(),
        status: statusByNode.get(n._id.toString()) || 'not-started'
      }))
    });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a node's learning status (used by the roadmap hover toolbar)
router.patch('/nodes/:nodeId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['not-started', 'in-progress', 'done', 'skipped'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const node = await RoadmapNode.findById(req.params.nodeId);
    if (!node) {
      return res.status(404).json({ message: 'Roadmap node not found' });
    }
    await RoadmapNodeStatus.findOneAndUpdate(
      { user: req.user.id, node: node._id },
      { status },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ ...node.toObject(), status });
  } catch (error) {
    console.error('Update node status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
