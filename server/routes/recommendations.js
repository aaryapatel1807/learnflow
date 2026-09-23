const express = require('express');
const LearningPath = require('../models/LearningPath');
const LearningPathNode = require('../models/LearningPathNode');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');

const router = express.Router();

// Helper: Check if a node is complete
async function isNodeComplete(node, completedMap) {
  if (node.contentType === 'book' && node.book) {
    // For book nodes, check if all chapters are completed
    const chapters = await Chapter.find({ book: node.book });
    const bookProgress = completedMap.get(`book-${node.book}`);
    if (bookProgress && chapters.length > 0) {
      return chapters.every(ch => 
        bookProgress.completedChapters.includes(ch._id.toString())
      );
    }
    return false;
  } else if (node.contentType === 'chapter' && node.chapter && node.book) {
    // For chapter nodes, check if this specific chapter is completed
    const bookProgress = completedMap.get(`book-${node.book}`);
    if (bookProgress) {
      return bookProgress.completedChapters.includes(node.chapter.toString());
    }
    return false;
  }
  return false;
}

// Helper: Check if all prerequisites for a node are satisfied
async function arePrerequisitesSatisfied(node, allNodes, completedMap) {
  if (!node.prerequisiteNodeIds || node.prerequisiteNodeIds.length === 0) {
    return true; // No prerequisites means it's always available
  }

  // Check each prerequisite
  for (const prereqId of node.prerequisiteNodeIds) {
    const prereqNode = allNodes.find(n => n._id.toString() === prereqId.toString());
    if (!prereqNode) {
      return false; // Prerequisite not found, consider locked
    }

    const prereqComplete = await isNodeComplete(prereqNode, completedMap);
    if (!prereqComplete) {
      return false; // At least one prerequisite not complete
    }
  }

  return true; // All prerequisites satisfied
}

// GET /api/recommendations/:userId - Get recommended next node
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

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

    // Get all learning paths
    const learningPaths = await LearningPath.find();

    let recommendedNode = null;
    let mostRecentCompletionDate = null;
    let pathForRecommendation = null;

    // For each learning path, find the most recently completed node
    for (const path of learningPaths) {
      const nodes = await LearningPathNode.find({ learningPath: path._id })
        .populate('book', 'title author coverImage')
        .populate('chapter', 'title chapterNumber')
        .sort('order');

      if (nodes.length === 0) continue;

      // Find the most recently completed node in this path
      let lastCompletedNode = null;
      let lastCompletedDate = null;

      for (const node of nodes) {
        const isComplete = await isNodeComplete(node, completedMap);
        
        if (isComplete) {
          // Get the completion date from progress
          let completionDate = null;
          if (node.contentType === 'chapter' && node.chapter && node.book) {
            const progress = userProgress.find(p => p.book.toString() === node.book._id.toString());
            if (progress) {
              const chapterProgress = progress.completedChapters.find(
                ch => ch.toString() === node.chapter._id.toString()
              );
              if (chapterProgress) {
                // Use the progress updatedAt as approximation
                completionDate = progress.updatedAt;
              }
            }
          }

          if (!lastCompletedDate || (completionDate && completionDate > lastCompletedDate)) {
            lastCompletedNode = node;
            lastCompletedDate = completionDate || new Date(0);
          }
        }
      }

      // If we found a completed node in this path
      if (lastCompletedNode) {
        // Find the next node in order that is unlocked but not complete
        for (const node of nodes) {
          const isComplete = await isNodeComplete(node, completedMap);
          
          if (!isComplete) {
            const prereqsSatisfied = await arePrerequisitesSatisfied(node, nodes, completedMap);
            
            if (prereqsSatisfied) {
              // This is a candidate recommendation
              // Use the most recent path's next node
              if (!mostRecentCompletionDate || lastCompletedDate > mostRecentCompletionDate) {
                recommendedNode = node;
                mostRecentCompletionDate = lastCompletedDate;
                pathForRecommendation = path;
              }
              break; // Take the first eligible node in this path
            }
          }
        }
      }
    }

    // If no recommended node found based on completion, suggest the first unlocked node
    if (!recommendedNode) {
      for (const path of learningPaths) {
        const nodes = await LearningPathNode.find({ learningPath: path._id })
          .populate('book', 'title author coverImage')
          .populate('chapter', 'title chapterNumber')
          .sort('order');

        for (const node of nodes) {
          const isComplete = await isNodeComplete(node, completedMap);
          
          if (!isComplete) {
            const prereqsSatisfied = await arePrerequisitesSatisfied(node, nodes, completedMap);
            
            if (prereqsSatisfied) {
              recommendedNode = node;
              pathForRecommendation = path;
              break;
            }
          }
        }

        if (recommendedNode) break;
      }
    }

    if (!recommendedNode) {
      return res.json({
        recommendation: null,
        message: 'No recommendations available. Complete some learning path content to get personalized suggestions!'
      });
    }

    // Return the recommendation with full details
    res.json({
      recommendation: {
        _id: recommendedNode._id,
        title: recommendedNode.title,
        description: recommendedNode.description,
        order: recommendedNode.order,
        contentType: recommendedNode.contentType,
        book: recommendedNode.book,
        chapter: recommendedNode.chapter,
        learningPath: {
          _id: pathForRecommendation._id,
          title: pathForRecommendation.title
        },
        prerequisitesSatisfied: true
      },
      message: 'Here\'s your next recommended learning step!'
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
