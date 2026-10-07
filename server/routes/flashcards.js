const express = require('express');
const Flashcard = require('../models/Flashcard');
const FlashcardReview = require('../models/FlashcardReview');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// SM-2 spaced-repetition scheduler (Anki-style), reimplemented from the
// published algorithm. Quality q in 0..5.
// Ratings map: Again -> 0, Hard -> 3, Good -> 4, Easy -> 5.
const RATING_QUALITY = { Again: 0, Hard: 3, Good: 4, Easy: 5 };

function sm2NextReview(prev, rating) {
  const q = RATING_QUALITY[rating];
  if (q === undefined) throw new Error('Invalid rating');

  // Lazy-migrate legacy records: seed SM-2 state from old fields.
  let { easiness = 2.5, interval = 0, repetitions = 0 } = prev || {};
  if (prev && prev.repetitions === undefined && prev.reviewCount > 0) {
    repetitions = prev.reviewCount;
    interval = Math.max(1, prev.difficulty || 1);
  }

  let nextInterval;
  let nextRepetitions = repetitions;

  if (q < 3) {
    // Failed recall: restart the repetition chain. 'Again' relearns tomorrow.
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    if (repetitions === 0) nextInterval = 1;
    else if (repetitions === 1) nextInterval = 6;
    else nextInterval = Math.round(interval * easiness);
    nextRepetitions = repetitions + 1;
  }

  // Easiness factor update (only meaningful on recall, but SM-2 applies it
  // for every graded review; floor at 1.3).
  let nextEasiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  nextEasiness = Math.max(1.3, Math.round(nextEasiness * 100) / 100);

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + nextInterval);

  return {
    nextReview,
    nextEasiness,
    nextInterval,
    nextRepetitions,
    quality: q,
  };
}

// Legacy alias kept for any external callers.
function calculateNextReview(difficulty, rating) {
  const { nextReview } = sm2NextReview(
    { easiness: 2.5, interval: Math.max(1, difficulty || 1), repetitions: difficulty > 0 ? 1 : 0 },
    rating
  );
  return { nextReview, newDifficulty: difficulty };
}

// Helper: Update user streak and activity log
async function updateUserStreak(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!user.lastActivityDate) {
    // First activity ever
    user.currentStreak = 1;
    user.longestStreak = 1;
    user.lastActivityDate = today;
  } else {
    const lastActivity = new Date(user.lastActivityDate);
    const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
    const daysDiff = Math.floor((today - lastActivityDay) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, increment activity log but don't change streak
      await ActivityLog.incrementActivity(userId, today);
      return user;
    } else if (daysDiff === 1) {
      // Consecutive day
      user.currentStreak += 1;
      user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
      user.lastActivityDate = today;
    } else {
      // Streak broken
      user.currentStreak = 1;
      user.lastActivityDate = today;
    }
  }
  
  await user.save();
  
  // Increment activity log for the day
  await ActivityLog.incrementActivity(userId, today);
  
  return user;
}

// GET /api/flashcards/due - Get cards due for review
router.get('/due', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    const now = new Date();
    
    // Get all flashcards
    const allFlashcards = await Flashcard.find().populate('subject', 'name');
    
    // Get user's review records
    const userReviews = await FlashcardReview.find({ user: userId });
    const reviewMap = new Map();
    userReviews.forEach(review => {
      reviewMap.set(review.flashcard.toString(), review);
    });
    
    // Filter cards that are due
    const dueCards = [];
    for (const card of allFlashcards) {
      const review = reviewMap.get(card._id.toString());
      
      if (!review) {
        // New card, due by default
        dueCards.push({
          ...card.toObject(),
          reviewInfo: {
            lastReviewed: null,
            nextReview: now,
            difficulty: 0,
            easiness: 2.5,
            interval: 0,
            repetitions: 0,
            reviewCount: 0
          }
        });
      } else if (new Date(review.nextReview) <= now) {
        // Card is due for review
        dueCards.push({
          ...card.toObject(),
          reviewInfo: {
            lastReviewed: review.lastReviewed,
            nextReview: review.nextReview,
            difficulty: review.difficulty,
            easiness: review.easiness ?? 2.5,
            interval: review.interval ?? 0,
            repetitions: review.repetitions ?? 0,
            reviewCount: review.reviewCount
          }
        });
      }
    }
    
    res.json(dueCards);
  } catch (error) {
    console.error('Get due flashcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/flashcards/review - Record a flashcard review
router.post('/review', async (req, res) => {
  try {
    const { userId, flashcardId, rating } = req.body;
    
    if (!userId || !flashcardId || !rating) {
      return res.status(400).json({ message: 'userId, flashcardId, and rating are required' });
    }
    
    if (!['Again', 'Hard', 'Good', 'Easy'].includes(rating)) {
      return res.status(400).json({ message: 'Invalid rating' });
    }
    
    // Find or create review record
    let review = await FlashcardReview.findOne({ user: userId, flashcard: flashcardId });

    if (!review) {
      review = new FlashcardReview({
        user: userId,
        flashcard: flashcardId,
        difficulty: 0,
        easiness: 2.5,
        interval: 0,
        repetitions: 0,
        reviewCount: 0
      });
    }

    // SM-2 scheduling
    const { nextReview, nextEasiness, nextInterval, nextRepetitions } =
      sm2NextReview(review.toObject(), rating);

    // Update review record
    review.lastReviewed = new Date();
    review.nextReview = nextReview;
    review.easiness = nextEasiness;
    review.interval = nextInterval;
    review.repetitions = nextRepetitions;
    review.difficulty = nextRepetitions; // keep legacy field roughly in sync
    review.reviewCount += 1;

    await review.save();
    
    // Update user streak
    await updateUserStreak(userId);
    
    // Award XP for flashcard review
    const user = await User.findById(userId);
    user.xp += 5; // 5 XP per flashcard review
    await user.save();
    
    res.json({
      message: 'Review recorded',
      nextReview: review.nextReview,
      nextReviewInDays: nextInterval,
      easiness: nextEasiness,
      reviewCount: review.reviewCount,
      xpEarned: 5
    });
  } catch (error) {
    console.error('Record flashcard review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/flashcards - Get all flashcards
router.get('/', async (req, res) => {
  try {
    const flashcards = await Flashcard.find().populate('subject', 'name');
    res.json(flashcards);
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.updateUserStreak = updateUserStreak; // Export for use in other routes
