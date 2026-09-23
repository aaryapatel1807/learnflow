const express = require('express');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Book = require('../../models/Book');
const Chapter = require('../../models/Chapter');
const LearningPath = require('../../models/LearningPath');
const LearningPathNode = require('../../models/LearningPathNode');
const Roadmap = require('../../models/Roadmap');
const RoadmapNode = require('../../models/RoadmapNode');
const Quiz = require('../../models/Quiz');
const QuizQuestion = require('../../models/QuizQuestion');
const Flashcard = require('../../models/Flashcard');
const ActivityLog = require('../../models/ActivityLog');
const Progress = require('../../models/Progress');

const router = express.Router();

// GET /api/admin/dashboard - Get admin dashboard statistics
router.get('/', async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    
    // Active learners: users with activity in the last 7 days (from Phase 4's ActivityLog)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeLearners = await ActivityLog.distinct('user', {
      timestamp: { $gte: sevenDaysAgo }
    });

    // Content counts
    const totalSubjects = await Subject.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const totalLearningPaths = await LearningPath.countDocuments();
    const totalLearningPathNodes = await LearningPathNode.countDocuments();
    const totalRoadmaps = await Roadmap.countDocuments();
    const totalRoadmapNodes = await RoadmapNode.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalQuizQuestions = await QuizQuestion.countDocuments();
    const totalFlashcards = await Flashcard.countDocuments();

    // Most popular subject chart data (by completed progress count)
    const popularSubjects = await Progress.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $lookup: {
          from: 'chapters',
          localField: 'chapter',
          foreignField: '_id',
          as: 'chapterData'
        }
      },
      {
        $unwind: '$chapterData'
      },
      {
        $lookup: {
          from: 'books',
          localField: 'chapterData.book',
          foreignField: '_id',
          as: 'bookData'
        }
      },
      {
        $unwind: '$bookData'
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'bookData.subject',
          foreignField: '_id',
          as: 'subjectData'
        }
      },
      {
        $unwind: '$subjectData'
      },
      {
        $group: {
          _id: '$subjectData._id',
          name: { $first: '$subjectData.name' },
          completedCount: { $sum: 1 }
        }
      },
      {
        $sort: { completedCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // If no progress data, fall back to subject book count
    let subjectChartData = popularSubjects;
    
    if (popularSubjects.length === 0) {
      const subjectsByBookCount = await Book.aggregate([
        {
          $group: {
            _id: '$subject',
            bookCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: '_id',
            foreignField: '_id',
            as: 'subjectData'
          }
        },
        {
          $unwind: '$subjectData'
        },
        {
          $project: {
            _id: '$subjectData._id',
            name: '$subjectData.name',
            completedCount: '$bookCount'
          }
        },
        {
          $sort: { completedCount: -1 }
        },
        {
          $limit: 10
        }
      ]);

      subjectChartData = subjectsByBookCount;
    }

    // Recent activity summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivityCount = await ActivityLog.countDocuments({
      timestamp: { $gte: thirtyDaysAgo }
    });

    // User engagement metrics
    const totalProgress = await Progress.countDocuments();
    const completedProgress = await Progress.countDocuments({ status: 'completed' });
    const averageCompletionRate = totalProgress > 0 
      ? ((completedProgress / totalProgress) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          activeLast7Days: activeLearners.length
        },
        content: {
          subjects: totalSubjects,
          books: totalBooks,
          chapters: totalChapters,
          learningPaths: totalLearningPaths,
          learningPathNodes: totalLearningPathNodes,
          roadmaps: totalRoadmaps,
          roadmapNodes: totalRoadmapNodes,
          quizzes: totalQuizzes,
          quizQuestions: totalQuizQuestions,
          flashcards: totalFlashcards
        },
        engagement: {
          recentActivityLast30Days: recentActivityCount,
          totalProgress: totalProgress,
          completedProgress: completedProgress,
          averageCompletionRate: `${averageCompletionRate}%`
        },
        popularSubjects: subjectChartData.map(s => ({
          id: s._id,
          name: s.name,
          count: s.completedCount
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
