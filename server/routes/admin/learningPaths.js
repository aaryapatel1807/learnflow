const express = require('express');
const LearningPath = require('../../models/LearningPath');
const LearningPathNode = require('../../models/LearningPathNode');
const Subject = require('../../models/Subject');
const Book = require('../../models/Book');
const Chapter = require('../../models/Chapter');

const router = express.Router();

// GET /api/admin/learning-paths - Get all learning paths with node count
router.get('/', async (req, res) => {
  try {
    const paths = await LearningPath.find()
      .populate('subject', 'name')
      .sort({ title: 1 });

    // Add node count to each path
    const pathsWithDetails = await Promise.all(
      paths.map(async (path) => {
        const nodeCount = await LearningPathNode.countDocuments({ learningPath: path._id });
        return {
          ...path.toObject(),
          nodeCount
        };
      })
    );

    res.json(pathsWithDetails);
  } catch (error) {
    console.error('Get learning paths error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/admin/learning-paths/:id - Get single learning path with nodes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const path = await LearningPath.findById(id).populate('subject', 'name');
    
    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    const nodes = await LearningPathNode.find({ learningPath: id })
      .populate('book', 'title')
      .populate('chapter', 'title chapterNumber')
      .populate('prerequisiteNodeIds', 'title order')
      .sort('order');

    res.json({
      ...path.toObject(),
      nodes
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/admin/learning-paths - Create a new learning path
router.post('/', async (req, res) => {
  try {
    const { title, description, subject, difficulty, estimatedDuration } = req.body;

    if (!title || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title and subject are required'
      });
    }

    // Verify subject exists
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const path = await LearningPath.create({
      title,
      description: description || '',
      subject,
      difficulty: difficulty || 'Beginner',
      estimatedDuration: estimatedDuration || ''
    });

    const populatedPath = await LearningPath.findById(path._id).populate('subject', 'name');

    res.status(201).json({
      success: true,
      learningPath: populatedPath
    });
  } catch (error) {
    console.error('Create learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/learning-paths/:id - Update a learning path
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, difficulty, estimatedDuration } = req.body;

    if (!title || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title and subject are required'
      });
    }

    // Verify subject exists
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const path = await LearningPath.findByIdAndUpdate(
      id,
      { title, description, subject, difficulty, estimatedDuration },
      { new: true, runValidators: true }
    ).populate('subject', 'name');

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.json({
      success: true,
      learningPath: path
    });
  } catch (error) {
    console.error('Update learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/learning-paths/:id - Delete a learning path
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all nodes associated with this path
    await LearningPathNode.deleteMany({ learningPath: id });

    const path = await LearningPath.findByIdAndDelete(id);

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.json({
      success: true,
      message: 'Learning path and its nodes deleted successfully'
    });
  } catch (error) {
    console.error('Delete learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ====== NODE MANAGEMENT ======

// POST /api/admin/learning-paths/:pathId/nodes - Add a node to a path
router.post('/:pathId/nodes', async (req, res) => {
  try {
    const { pathId } = req.params;
    const { title, description, order, prerequisiteNodeIds, contentType, book, chapter } = req.body;

    if (!title || order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title and order are required'
      });
    }

    const path = await LearningPath.findById(pathId);
    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    // Validate content references
    if (contentType === 'chapter' && book && chapter) {
      const bookExists = await Book.findById(book);
      const chapterExists = await Chapter.findById(chapter);
      
      if (!bookExists || !chapterExists) {
        return res.status(400).json({
          success: false,
          message: 'Book or chapter not found'
        });
      }
    }

    // Validate prerequisite nodes exist and belong to same path
    if (prerequisiteNodeIds && prerequisiteNodeIds.length > 0) {
      const prereqNodes = await LearningPathNode.find({
        _id: { $in: prerequisiteNodeIds },
        learningPath: pathId
      });

      if (prereqNodes.length !== prerequisiteNodeIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more prerequisite nodes not found or do not belong to this path'
        });
      }
    }

    const node = await LearningPathNode.create({
      learningPath: pathId,
      title,
      description: description || '',
      order,
      prerequisiteNodeIds: prerequisiteNodeIds || [],
      contentType: contentType || 'none',
      book: book || null,
      chapter: chapter || null
    });

    const populatedNode = await LearningPathNode.findById(node._id)
      .populate('book', 'title')
      .populate('chapter', 'title chapterNumber')
      .populate('prerequisiteNodeIds', 'title order');

    res.status(201).json({
      success: true,
      node: populatedNode
    });
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/learning-paths/:pathId/nodes/:nodeId - Update a node
router.put('/:pathId/nodes/:nodeId', async (req, res) => {
  try {
    const { pathId, nodeId } = req.params;
    const { title, description, order, prerequisiteNodeIds, contentType, book, chapter } = req.body;

    if (!title || order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title and order are required'
      });
    }

    // Validate content references
    if (contentType === 'chapter' && book && chapter) {
      const bookExists = await Book.findById(book);
      const chapterExists = await Chapter.findById(chapter);
      
      if (!bookExists || !chapterExists) {
        return res.status(400).json({
          success: false,
          message: 'Book or chapter not found'
        });
      }
    }

    // Validate prerequisite nodes (cannot be itself)
    if (prerequisiteNodeIds && prerequisiteNodeIds.includes(nodeId)) {
      return res.status(400).json({
        success: false,
        message: 'A node cannot be its own prerequisite'
      });
    }

    // Validate prerequisite nodes exist and belong to same path
    if (prerequisiteNodeIds && prerequisiteNodeIds.length > 0) {
      const prereqNodes = await LearningPathNode.find({
        _id: { $in: prerequisiteNodeIds },
        learningPath: pathId
      });

      if (prereqNodes.length !== prerequisiteNodeIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more prerequisite nodes not found or do not belong to this path'
        });
      }
    }

    const node = await LearningPathNode.findByIdAndUpdate(
      nodeId,
      { 
        title, 
        description, 
        order, 
        prerequisiteNodeIds: prerequisiteNodeIds || [],
        contentType,
        book: book || null,
        chapter: chapter || null
      },
      { new: true, runValidators: true }
    )
      .populate('book', 'title')
      .populate('chapter', 'title chapterNumber')
      .populate('prerequisiteNodeIds', 'title order');

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
    console.error('Update node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/learning-paths/:pathId/nodes/:nodeId - Delete a node
router.delete('/:pathId/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

    // Check if other nodes depend on this one
    const dependentNodes = await LearningPathNode.find({
      prerequisiteNodeIds: nodeId
    });

    if (dependentNodes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete node. ${dependentNodes.length} other node(s) depend on it as a prerequisite.`
      });
    }

    const node = await LearningPathNode.findByIdAndDelete(nodeId);

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
    console.error('Delete node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/learning-paths/:pathId/nodes/reorder - Reorder nodes
router.put('/:pathId/nodes/reorder', async (req, res) => {
  try {
    const { pathId } = req.params;
    const { nodes } = req.body; // Array of { nodeId, order }

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nodes array is required'
      });
    }

    // Update each node's order
    const updatePromises = nodes.map(({ nodeId, order }) =>
      LearningPathNode.findByIdAndUpdate(nodeId, { order })
    );

    await Promise.all(updatePromises);

    const updatedNodes = await LearningPathNode.find({ learningPath: pathId })
      .populate('book', 'title')
      .populate('chapter', 'title chapterNumber')
      .populate('prerequisiteNodeIds', 'title order')
      .sort('order');

    res.json({
      success: true,
      nodes: updatedNodes
    });
  } catch (error) {
    console.error('Reorder nodes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
