const express = require('express');
const SkillNode = require('../models/SkillNode');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');

const router = express.Router();

// Helper: Check if a skill node is complete based on user's progress
async function isSkillNodeComplete(node, completedMap) {
  if (node.contentType === 'chapter' && node.chapter && node.book) {
    const bookProgress = completedMap.get(`book-${node.book}`);
    if (bookProgress) {
      return bookProgress.completedChapters.includes(node.chapter.toString());
    }
    return false;
  } else if (node.contentType === 'topic') {
    // Topic completion tracking can be added later
    // For now, assume not complete unless chapter-based
    return false;
  }
  // Nodes with no content are considered complete if they exist
  return node.contentType === 'none';
}

// Helper: Check if all prerequisites are satisfied (supports multiple prerequisites)
async function arePrerequisitesSatisfied(node, allNodes, completedMap) {
  if (!node.prerequisiteSkillNodeIds || node.prerequisiteSkillNodeIds.length === 0) {
    return true; // No prerequisites
  }

  // Check ALL prerequisites - node is only unlocked if ALL are complete
  for (const prereqId of node.prerequisiteSkillNodeIds) {
    const prereqNode = allNodes.find(n => n._id.toString() === prereqId.toString());
    
    if (!prereqNode) {
      return false; // Prerequisite not found
    }

    const prereqComplete = await isSkillNodeComplete(prereqNode, completedMap);
    if (!prereqComplete) {
      return false; // At least one prerequisite not complete
    }
  }

  return true; // All prerequisites satisfied
}

// GET /api/skill-tree/:subjectId - Get skill tree for a subject with node states
router.get('/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { userId } = req.query;

    // Get all skill nodes for this subject
    const nodes = await SkillNode.find({ subject: subjectId })
      .populate('prerequisiteSkillNodeIds', 'title')
      .populate('book', 'title')
      .populate('chapter', 'title chapterNumber')
      .sort('layer order')
      .lean();

    if (!userId) {
      // No user context, return nodes without state
      return res.json({
        subjectId,
        nodes: nodes.map(node => ({
          ...node,
          state: 'locked'
        }))
      });
    }

    // Get user's progress
    const userProgress = await Progress.find({ user: userId });
    
    // Create a map of completed chapters
    const completedMap = new Map();
    for (const progress of userProgress) {
      const key = `book-${progress.book}`;
      completedMap.set(key, {
        completedChapters: progress.completedChapters.map(ch => ch.toString())
      });
    }

    // Compute state for each node
    const nodesWithState = await Promise.all(nodes.map(async (node) => {
      const isComplete = await isSkillNodeComplete(node, completedMap);
      const prereqsSatisfied = await arePrerequisitesSatisfied(node, nodes, completedMap);
      
      let state = 'locked';
      if (isComplete) {
        state = 'complete';
      } else if (prereqsSatisfied) {
        state = 'current'; // Unlocked but not complete
      }

      return {
        ...node,
        state, // 'locked', 'current', or 'complete'
        isLocked: state === 'locked',
        isCurrent: state === 'current',
        isComplete: state === 'complete'
      };
    }));

    res.json({
      subjectId,
      nodes: nodesWithState
    });

  } catch (error) {
    console.error('Get skill tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/skill-tree/node/:nodeId - Get single skill node details
router.get('/node/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

    const node = await SkillNode.findById(nodeId)
      .populate('subject', 'name')
      .populate('prerequisiteSkillNodeIds', 'title')
      .populate('book', 'title author')
      .populate('chapter', 'title chapterNumber')
      .lean();

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Skill node not found'
      });
    }

    res.json(node);

  } catch (error) {
    console.error('Get skill node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
