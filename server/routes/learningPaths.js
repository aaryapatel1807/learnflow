const express = require('express');
const LearningPath = require('../models/LearningPath');
const LearningPathNode = require('../models/LearningPathNode');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');

const router = express.Router();

// Get all learning paths
router.get('/', async (req, res) => {
  try {
    const learningPaths = await LearningPath.find().populate('subject', 'name');
    
    // Add node count to each path
    const pathsWithDetails = await Promise.all(
      learningPaths.map(async (path) => {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single learning path with lock/unlock/complete state
router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const learningPath = await LearningPath.findById(req.params.id).populate('subject', 'name');
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // Get all nodes for this path
    const nodes = await LearningPathNode.find({ learningPath: req.params.id })
      .populate('book', 'title author coverImage')
      .populate('chapter', 'title chapterNumber')
      .populate('prerequisiteNodeIds', 'title order')
      .sort('order');

    // If userId provided, compute lock/unlock/complete state
    let nodesWithState = nodes;
    if (userId) {
      // Get user's progress
      const userProgress = await Progress.find({ user: userId });
      
      // Create a map of completed books and chapters
      const completedMap = new Map();
      for (const progress of userProgress) {
        const key = `book-${progress.book}`;
        completedMap.set(key, {
          completedChapters: progress.completedChapters.map(ch => ch.toString())
        });
      }

      nodesWithState = await Promise.all(nodes.map(async (node) => {
        const nodeObj = node.toObject();
        
        // Check if node is complete
        let isComplete = false;
        if (node.contentType === 'book' && node.book) {
          // For book nodes, check if all chapters are completed
          const chapters = await Chapter.find({ book: node.book._id });
          const bookProgress = completedMap.get(`book-${node.book._id}`);
          if (bookProgress && chapters.length > 0) {
            const allChaptersComplete = chapters.every(ch => 
              bookProgress.completedChapters.includes(ch._id.toString())
            );
            isComplete = allChaptersComplete;
          }
        } else if (node.contentType === 'chapter' && node.chapter && node.book) {
          // For chapter nodes, check if this specific chapter is completed
          const bookProgress = completedMap.get(`book-${node.book._id}`);
          if (bookProgress) {
            isComplete = bookProgress.completedChapters.includes(node.chapter._id.toString());
          }
        }

        // Check if node is locked (any prerequisite not complete)
        let isLocked = false;
        if (node.prerequisiteNodeIds && node.prerequisiteNodeIds.length > 0) {
          // Check each prerequisite
          for (const prereqNode of node.prerequisiteNodeIds) {
            const prereqNodeFull = nodes.find(n => n._id.toString() === prereqNode._id.toString());
            if (prereqNodeFull) {
              // Recursively check if prerequisite is complete
              let prereqComplete = false;
              if (prereqNodeFull.contentType === 'book' && prereqNodeFull.book) {
                const chapters = await Chapter.find({ book: prereqNodeFull.book });
                const bookProgress = completedMap.get(`book-${prereqNodeFull.book}`);
                if (bookProgress && chapters.length > 0) {
                  prereqComplete = chapters.every(ch => 
                    bookProgress.completedChapters.includes(ch._id.toString())
                  );
                }
              } else if (prereqNodeFull.contentType === 'chapter' && prereqNodeFull.chapter && prereqNodeFull.book) {
                const bookProgress = completedMap.get(`book-${prereqNodeFull.book}`);
                if (bookProgress) {
                  prereqComplete = bookProgress.completedChapters.includes(prereqNodeFull.chapter.toString());
                }
              }
              
              if (!prereqComplete) {
                isLocked = true;
                break;
              }
            }
          }
        }

        return {
          ...nodeObj,
          isLocked,
          isComplete,
          isCurrent: !isLocked && !isComplete
        };
      }));
    }

    res.json({
      ...learningPath.toObject(),
      nodes: nodesWithState
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
