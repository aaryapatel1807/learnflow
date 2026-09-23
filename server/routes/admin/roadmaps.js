const express = require('express');
const Roadmap = require('../../models/Roadmap');
const RoadmapNode = require('../../models/RoadmapNode');
const LearningPath = require('../../models/LearningPath');

const router = express.Router();

// GET /api/admin/roadmaps - Get all roadmaps with node count
router.get('/', async (req, res) => {
  try {
    const roadmaps = await Roadmap.find().sort({ title: 1 });

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
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/admin/roadmaps/:id - Get single roadmap with nodes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const roadmap = await Roadmap.findById(id);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const nodes = await RoadmapNode.find({ roadmap: id })
      .populate('learningPath', 'title difficulty')
      .sort('order');

    res.json({
      ...roadmap.toObject(),
      nodes
    });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/admin/roadmaps - Create a new roadmap
router.post('/', async (req, res) => {
  try {
    const { title, description, category, targetAudience, estimatedDuration } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const roadmap = await Roadmap.create({
      title,
      description: description || '',
      category: category || 'General',
      targetAudience: targetAudience || '',
      estimatedDuration: estimatedDuration || ''
    });

    res.status(201).json({
      success: true,
      roadmap
    });
  } catch (error) {
    console.error('Create roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/roadmaps/:id - Update a roadmap
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, targetAudience, estimatedDuration } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const roadmap = await Roadmap.findByIdAndUpdate(
      id,
      { title, description, category, targetAudience, estimatedDuration },
      { new: true, runValidators: true }
    );

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    res.json({
      success: true,
      roadmap
    });
  } catch (error) {
    console.error('Update roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/roadmaps/:id - Delete a roadmap
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all nodes associated with this roadmap
    await RoadmapNode.deleteMany({ roadmap: id });

    const roadmap = await Roadmap.findByIdAndDelete(id);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    res.json({
      success: true,
      message: 'Roadmap and its nodes deleted successfully'
    });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ====== NODE MANAGEMENT ======

// POST /api/admin/roadmaps/:roadmapId/nodes - Add a node to a roadmap
router.post('/:roadmapId/nodes', async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const { title, description, order, phase, learningPath, milestone } = req.body;

    if (!title || order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title and order are required'
      });
    }

    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Check if order already exists
    const existingNode = await RoadmapNode.findOne({ roadmap: roadmapId, order });
    if (existingNode) {
      return res.status(400).json({
        success: false,
        message: `Node with order ${order} already exists for this roadmap`
      });
    }

    // Validate learning path if provided
    if (learningPath) {
      const pathExists = await LearningPath.findById(learningPath);
      if (!pathExists) {
        return res.status(400).json({
          success: false,
          message: 'Learning path not found'
        });
      }
    }

    const node = await RoadmapNode.create({
      roadmap: roadmapId,
      title,
      description: description || '',
      order,
      phase: phase || '',
      learningPath: learningPath || null,
      milestone: milestone || ''
    });

    const populatedNode = await RoadmapNode.findById(node._id)
      .populate('learningPath', 'title difficulty');

    res.status(201).json({
      success: true,
      node: populatedNode
    });
  } catch (error) {
    console.error('Create roadmap node error:', error);
    
    // Handle duplicate order error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A node with this order already exists for this roadmap'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/roadmaps/:roadmapId/nodes/:nodeId - Update a node
router.put('/:roadmapId/nodes/:nodeId', async (req, res) => {
  try {
    const { roadmapId, nodeId } = req.params;
    const { title, description, order, phase, learningPath, milestone } = req.body;

    if (!title || order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title and order are required'
      });
    }

    // Check if another node has this order
    const existingNode = await RoadmapNode.findOne({
      roadmap: roadmapId,
      order,
      _id: { $ne: nodeId }
    });

    if (existingNode) {
      return res.status(400).json({
        success: false,
        message: `Another node with order ${order} already exists for this roadmap`
      });
    }

    // Validate learning path if provided
    if (learningPath) {
      const pathExists = await LearningPath.findById(learningPath);
      if (!pathExists) {
        return res.status(400).json({
          success: false,
          message: 'Learning path not found'
        });
      }
    }

    const node = await RoadmapNode.findByIdAndUpdate(
      nodeId,
      { 
        title, 
        description, 
        order, 
        phase,
        learningPath: learningPath || null,
        milestone
      },
      { new: true, runValidators: true }
    ).populate('learningPath', 'title difficulty');

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Node not found'
      });
    }

    res.json({
      success: true,
      node
    });
  } catch (error) {
    console.error('Update roadmap node error:', error);
    
    // Handle duplicate order error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A node with this order already exists for this roadmap'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/roadmaps/:roadmapId/nodes/:nodeId - Delete a node
router.delete('/:roadmapId/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

    const node = await RoadmapNode.findByIdAndDelete(nodeId);

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Node not found'
      });
    }

    res.json({
      success: true,
      message: 'Node deleted successfully'
    });
  } catch (error) {
    console.error('Delete roadmap node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/roadmaps/:roadmapId/nodes/reorder - Reorder nodes
router.put('/:roadmapId/nodes/reorder', async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const { nodes } = req.body; // Array of { nodeId, order }

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nodes array is required'
      });
    }

    // Update each node's order
    const updatePromises = nodes.map(({ nodeId, order }) =>
      RoadmapNode.findByIdAndUpdate(nodeId, { order })
    );

    await Promise.all(updatePromises);

    const updatedNodes = await RoadmapNode.find({ roadmap: roadmapId })
      .populate('learningPath', 'title difficulty')
      .sort('order');

    res.json({
      success: true,
      nodes: updatedNodes
    });
  } catch (error) {
    console.error('Reorder roadmap nodes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
