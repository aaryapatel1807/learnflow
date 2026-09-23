const express = require('express');
const Roadmap = require('../models/Roadmap');
const RoadmapNode = require('../models/RoadmapNode');

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

    res.json({
      ...roadmap.toObject(),
      nodes
    });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
