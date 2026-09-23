const express = require('express');
const Progress = require('../models/Progress');
const Chapter = require('../models/Chapter');
const Book = require('../models/Book');
const User = require('../models/User');
const { 
  validateRequiredFields,
  validateObjectId,
  validateNumericRange,
  sanitizeInput 
} = require('../middleware/validation');
const { authenticateToken, authorizeUserOrAdmin } = require('../middleware/auth');
const { updateUserStreak } = require('./flashcards');
const { checkAndUnlockAchievements } = require('./achievements');

const router = express.Router();

// Get user's progress (authenticated users can only access their own progress)
router.get('/:userId', 
  authenticateToken,
  authorizeUserOrAdmin('userId'),
  validateObjectId('userId'),
  async (req, res) => {
    try {
      const progress = await Progress.find({ user: req.params.userId })
        .populate('book', 'title author coverImage subject difficulty')
        .populate('chapter', 'title chapterNumber pages')
        .populate('completedChapters', 'title chapterNumber pages')
        .sort({ updatedAt: -1 });

      if (!progress || progress.length === 0) {
        return res.json({
          success: true,
          message: 'No progress found for this user',
          data: []
        });
      }

      // Calculate completion statistics
      const stats = {
        totalBooks: progress.length,
        completedBooks: progress.filter(p => p.completedChapters.length > 0).length,
        totalCompletedChapters: progress.reduce((sum, p) => sum + p.completedChapters.length, 0),
        lastUpdated: progress[0].updatedAt
      };

      res.json({
        success: true,
        count: progress.length,
        stats,
        data: progress
      });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Get progress for a specific book
router.get('/:userId/book/:bookId',
  authenticateToken,
  authorizeUserOrAdmin('userId'),
  validateObjectId('userId'),
  validateObjectId('bookId'),
  async (req, res) => {
    try {
      // Check if book exists
      const book = await Book.findById(req.params.bookId);
      if (!book) {
        return res.status(404).json({ 
          success: false,
          message: 'Book not found' 
        });
      }

      const progress = await Progress.findOne({ 
        user: req.params.userId, 
        book: req.params.bookId 
      })
        .populate('book', 'title author coverImage subject difficulty')
        .populate('chapter', 'title chapterNumber pages')
        .populate('completedChapters', 'title chapterNumber pages');

      if (!progress) {
        // Return empty progress with book info
        return res.json({
          success: true,
          message: 'No progress found for this book',
          data: null,
          bookInfo: {
            id: book._id,
            title: book.title,
            author: book.author,
            subject: book.subject,
            difficulty: book.difficulty
          }
        });
      }

      // Get total chapters in the book
      const totalChapters = await Chapter.countDocuments({ book: req.params.bookId });
      const completionPercentage = totalChapters > 0 
        ? Math.round((progress.completedChapters.length / totalChapters) * 100) 
        : 0;

      res.json({
        success: true,
        data: progress,
        stats: {
          totalChapters,
          completedChapters: progress.completedChapters.length,
          completionPercentage,
          lastPageRead: progress.lastPageRead,
          currentChapter: progress.chapter
        }
      });
    } catch (error) {
      console.error('Get book progress error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Update or create progress
router.post('/',
  authenticateToken,
  sanitizeInput(),
  validateRequiredFields(['bookId']),
  validateObjectId('bookId'),
  validateNumericRange('lastPageRead', 1, 10000),
  async (req, res) => {
    try {
      const { bookId, chapterId, lastPageRead, isChapterComplete } = req.body;
      const userId = req.user.id;

      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ 
          success: false,
          message: 'Book not found' 
        });
      }

      // Check if chapter exists (if provided)
      if (chapterId) {
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
          return res.status(404).json({ 
            success: false,
            message: 'Chapter not found' 
          });
        }
        
        // Verify chapter belongs to the book
        if (chapter.book.toString() !== bookId) {
          return res.status(400).json({ 
            success: false,
            message: 'Chapter does not belong to the specified book' 
          });
        }
      }

      let progress = await Progress.findOne({ user: userId, book: bookId });

      // Create new progress record if it doesn't exist
      if (!progress) {
        progress = new Progress({
          user: userId,
          book: bookId,
          chapter: chapterId || null,
          lastPageRead: lastPageRead || 1,
          completedChapters: []
        });
      } else {
        // Update existing progress
        if (chapterId) {
          progress.chapter = chapterId;
        }
        
        if (lastPageRead !== undefined) {
          progress.lastPageRead = lastPageRead;
        }
      }

      // Handle chapter completion
      let chapterJustCompleted = false;
      if (isChapterComplete && chapterId) {
        if (!progress.completedChapters.includes(chapterId)) {
          progress.completedChapters.push(chapterId);
          chapterJustCompleted = true;
        }
      }

      await progress.save();

      // Award XP and update streak for chapter completion
      if (chapterJustCompleted) {
        const user = await User.findById(userId);
        user.xp += 10; // 10 XP for completing a chapter
        await user.save();
        
        // Update streak
        await updateUserStreak(userId);
        
        // Check achievements
        await checkAndUnlockAchievements(userId, 'chapter_complete');
      }

      // Populate for response
      await progress.populate('book', 'title author coverImage');
      await progress.populate('chapter', 'title chapterNumber pages');
      await progress.populate('completedChapters', 'title chapterNumber pages');

      res.json({
        success: true,
        data: progress,
        message: 'Progress updated successfully',
        xpEarned: chapterJustCompleted ? 10 : 0
      });
    } catch (error) {
      console.error('Update progress error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Duplicate progress entry' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Mark chapter as complete
router.post('/complete-chapter',
  authenticateToken,
  sanitizeInput(),
  validateRequiredFields(['bookId', 'chapterId']),
  validateObjectId('bookId'),
  validateObjectId('chapterId'),
  async (req, res) => {
    try {
      const { bookId, chapterId } = req.body;
      const userId = req.user.id;

      // Verify chapter belongs to book
      const chapter = await Chapter.findOne({ 
        _id: chapterId, 
        book: bookId 
      });
      
      if (!chapter) {
        return res.status(404).json({ 
          success: false,
          message: 'Chapter not found or does not belong to the specified book' 
        });
      }

      let progress = await Progress.findOne({ user: userId, book: bookId });

      // Create progress record if it doesn't exist
      if (!progress) {
        progress = new Progress({
          user: userId,
          book: bookId,
          chapter: chapterId,
          lastPageRead: chapter.pages,
          completedChapters: [chapterId]
        });
      } else {
        // Update existing progress
        progress.chapter = chapterId;
        progress.lastPageRead = chapter.pages;
        
        // Add chapter to completed chapters if not already there
        if (!progress.completedChapters.includes(chapterId)) {
          progress.completedChapters.push(chapterId);
        }
      }

      await progress.save();

      // Award XP and update streak for chapter completion
      const user = await User.findById(userId);
      user.xp += 10; // 10 XP for completing a chapter
      await user.save();
      
      // Update streak
      await updateUserStreak(userId);
      
      // Check achievements (including learning path completion)
      await checkAndUnlockAchievements(userId, 'chapter_complete');

      // Populate for response
      await progress.populate('book', 'title author');
      await progress.populate('chapter', 'title chapterNumber pages');

      res.json({
        success: true,
        data: progress,
        message: `Chapter "${chapter.title}" marked as complete`,
        xpEarned: 10
      });
    } catch (error) {
      console.error('Complete chapter error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Reset progress for a book
router.delete('/:userId/book/:bookId',
  authenticateToken,
  authorizeUserOrAdmin('userId'),
  validateObjectId('userId'),
  validateObjectId('bookId'),
  async (req, res) => {
    try {
      const result = await Progress.findOneAndDelete({ 
        user: req.params.userId, 
        book: req.params.bookId 
      });

      if (!result) {
        return res.status(404).json({ 
          success: false,
          message: 'Progress not found for this book' 
        });
      }

      res.json({
        success: true,
        message: 'Progress reset successfully',
        data: {
          bookId: req.params.bookId,
          userId: req.params.userId
        }
      });
    } catch (error) {
      console.error('Reset progress error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

module.exports = router;
