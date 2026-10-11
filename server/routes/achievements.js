const express = require('express');
const mongoose = require('mongoose');
const { guardUserParam } = require('../middleware/auth');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const FlashcardReview = require('../models/FlashcardReview');
const QuizSubmission = require('../models/QuizSubmission');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');
const LearningPathNode = require('../models/LearningPathNode');

const router = express.Router();
guardUserParam(router);

// Helper: Check and unlock achievements for a user.
// Switches on Achievement.criteriaType (the values the schema enum and the seed
// actually use) and honours criteriaValue. Previously the switch matched on the
// achievement *keys* ('first_chapter', 'streak_7', ...), none of which equal a
// stored criteriaType, so no achievement could ever unlock.
// Returns the achievements newly unlocked by this call.
async function checkAndUnlockAchievements(userId, triggerType = null) {
  const unlocked = [];
  try {
    const user = await User.findById(userId);
    if (!user) return unlocked;

    const uid = new mongoose.Types.ObjectId(String(userId)); // aggregate() does not auto-cast
    const allAchievements = await Achievement.find();
    const userAchievements = await UserAchievement.find({ user: userId });
    const unlockedKeys = new Set(userAchievements.map(ua => ua.achievementKey));

    for (const achievement of allAchievements) {
      if (unlockedKeys.has(achievement.key)) continue;

      const target = achievement.criteriaValue || 1;
      let shouldUnlock = false;

      switch (achievement.criteriaType) {
        case 'chapters_completed': {
          const agg = await Progress.aggregate([
            { $match: { user: uid } },
            { $group: { _id: null, total: { $sum: { $size: '$completedChapters' } } } }
          ]);
          shouldUnlock = (agg[0]?.total || 0) >= target;
          break;
        }

        case 'books_completed': {
          const allProgress = await Progress.find({ user: userId });
          let done = 0;
          for (const prog of allProgress) {
            const totalChapters = await Chapter.countDocuments({ book: prog.book });
            if (totalChapters > 0 && prog.completedChapters.length >= totalChapters) done++;
          }
          shouldUnlock = done >= target;
          break;
        }

        case 'streak_days': {
          // longestStreak so a streak that was reached stays earned after it lapses
          shouldUnlock = Math.max(user.currentStreak || 0, user.longestStreak || 0) >= target;
          break;
        }

        case 'flashcard_reviews': {
          const agg = await FlashcardReview.aggregate([
            { $match: { user: uid } },
            { $group: { _id: null, total: { $sum: '$reviewCount' } } }
          ]);
          shouldUnlock = (agg[0]?.total || 0) >= target;
          break;
        }

        case 'xp_earned': {
          shouldUnlock = (user.xp || 0) >= target;
          break;
        }

        case 'high_score_quizzes': {
          // Seed copy: "Score 90% or higher on 5 quizzes"
          const count = await QuizSubmission.countDocuments({ user: userId, score: { $gte: 90 } });
          shouldUnlock = count >= target;
          break;
        }

        case 'learning_paths_completed': {
          const allNodes = await LearningPathNode.find();
          const pathGroups = {};
          allNodes.forEach(node => {
            const pathId = node.learningPath.toString();
            (pathGroups[pathId] = pathGroups[pathId] || []).push(node);
          });

          const progressByBook = new Map();
          const allProgress = await Progress.find({ user: userId });
          allProgress.forEach(p => progressByBook.set(p.book.toString(), p));

          let completedPaths = 0;
          for (const pathId in pathGroups) {
            const nodes = pathGroups[pathId];
            let allComplete = nodes.length > 0;

            for (const node of nodes) {
              const prog = node.book ? progressByBook.get(node.book.toString()) : null;
              if (!prog) { allComplete = false; break; }
              if (node.contentType === 'chapter' && node.chapter) {
                if (!prog.completedChapters.some(c => c.toString() === node.chapter.toString())) {
                  allComplete = false; break;
                }
              } else if (node.contentType === 'book') {
                const total = await Chapter.countDocuments({ book: node.book });
                if (total === 0 || prog.completedChapters.length < total) { allComplete = false; break; }
              }
            }
            if (allComplete) completedPaths++;
          }
          shouldUnlock = completedPaths >= target;
          break;
        }
      }

      if (shouldUnlock) {
        try {
          await new UserAchievement({ user: userId, achievementKey: achievement.key }).save();
          unlocked.push({ key: achievement.key, title: achievement.title, icon: achievement.icon });
          console.log(`🏆 Achievement unlocked for user ${userId}: ${achievement.title}`);
        } catch (err) {
          if (err.code !== 11000) throw err; // already unlocked by a concurrent request
        }
      }
    }
  } catch (error) {
    console.error('Check achievements error:', error);
  }
  return unlocked;
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
