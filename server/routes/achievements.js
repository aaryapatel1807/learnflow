const express = require('express');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const FlashcardReview = require('../models/FlashcardReview');
const QuizSubmission = require('../models/QuizSubmission');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');
const LearningPathNode = require('../models/LearningPathNode');

const router = express.Router();

// Helper: Check and unlock achievements for a user
async function checkAndUnlockAchievements(userId, triggerType = null) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    const allAchievements = await Achievement.find();
    const userAchievements = await UserAchievement.find({ user: userId });
    const unlockedKeys = new Set(userAchievements.map(ua => ua.achievementKey));
    
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedKeys.has(achievement.key)) continue;
      
      let shouldUnlock = false;
      
      switch (achievement.criteriaType) {
        case 'first_chapter': {
          // Check if user has completed at least one chapter
          const progress = await Progress.findOne({ 
            user: userId,
            completedChapters: { $ne: [] }
          });
          shouldUnlock = !!progress;
          break;
        }
        
        case 'complete_book': {
          // Check if user has completed all chapters of any book
          const allProgress = await Progress.find({ user: userId });
          for (const prog of allProgress) {
            const totalChapters = await Chapter.countDocuments({ book: prog.book });
            if (prog.completedChapters.length >= totalChapters && totalChapters > 0) {
              shouldUnlock = true;
              break;
            }
          }
          break;
        }
        
        case 'streak_7': {
          shouldUnlock = user.currentStreak >= 7;
          break;
        }
        
        case 'flashcard_reviews_100': {
          const totalReviews = await FlashcardReview.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, total: { $sum: '$reviewCount' } } }
          ]);
          shouldUnlock = totalReviews.length > 0 && totalReviews[0].total >= 100;
          break;
        }
        
        case 'visit_roadmap': {
          // This would be tracked by a separate event in a real app
          // For now, we'll consider it unlocked if user has any activity
          shouldUnlock = user.xp > 0;
          break;
        }
        
        case 'quiz_perfect_5': {
          const perfectScores = await QuizSubmission.countDocuments({
            user: userId,
            score: 100
          });
          shouldUnlock = perfectScores >= 5;
          break;
        }
        
        case 'complete_learning_path': {
          // Check if user completed all nodes in any learning path
          const allNodes = await LearningPathNode.find().populate('learningPath');
          const pathGroups = {};
          
          allNodes.forEach(node => {
            const pathId = node.learningPath._id.toString();
            if (!pathGroups[pathId]) {
              pathGroups[pathId] = [];
            }
            pathGroups[pathId].push(node);
          });
          
          for (const pathId in pathGroups) {
            const nodes = pathGroups[pathId];
            let allComplete = true;
            
            for (const node of nodes) {
              if (node.contentType === 'chapter' && node.chapter) {
                const progress = await Progress.findOne({
                  user: userId,
                  book: node.book,
                  completedChapters: node.chapter
                });
                if (!progress) {
                  allComplete = false;
                  break;
                }
              }
            }
            
            if (allComplete && nodes.length > 0) {
              shouldUnlock = true;
              break;
            }
          }
          break;
        }
      }
      
      if (shouldUnlock) {
        // Unlock the achievement
        const userAchievement = new UserAchievement({
          user: userId,
          achievementKey: achievement.key
        });
        await userAchievement.save();
        console.log(`🏆 Achievement unlocked for user ${userId}: ${achievement.title}`);
      }
    }
  } catch (error) {
    console.error('Check achievements error:', error);
  }
}

// GET /api/achievements - Get all achievement definitions
router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.find().sort('key');
    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/achievements/:userId - Get user's achievement progress
router.get('/:userId', async (req, res) => {
  try {
    const allAchievements = await Achievement.find().sort('key');
    const userAchievements = await UserAchievement.find({ user: req.params.userId });
    
    const unlockedMap = new Map();
    userAchievements.forEach(ua => {
      unlockedMap.set(ua.achievementKey, ua.unlockedAt);
    });
    
    const achievementsWithStatus = allAchievements.map(achievement => ({
      ...achievement.toObject(),
      isUnlocked: unlockedMap.has(achievement.key),
      unlockedAt: unlockedMap.get(achievement.key) || null
    }));
    
    res.json(achievementsWithStatus);
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.checkAndUnlockAchievements = checkAndUnlockAchievements;
