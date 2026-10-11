const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const StudySession = require('../models/StudySession');
const QuizSubmission = require('../models/QuizSubmission');
const User = require('../models/User');

const router = express.Router();

// Monday 00:00 server-local time — the start of the "week" for the board.
function weekStart() {
  const d = new Date();
  const diff = (d.getDay() + 6) % 7; // days since Monday (Mon=0 … Sun=6)
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/leaderboard/weekly
// Top 20 users by XP earned this week, plus the requester's own rank.
// Weekly XP = focus-session XP (exact, from StudySession.xpAwarded) +
// quiz XP (30 base + 50 perfect-score bonus, first attempt per quiz per
// calendar day — mirrors the 24h anti-farming rule closely enough for a board).
// LIMITATION: flashcard-review XP (5 XP when due) and chapter-completion XP
// (10 XP) are awarded at event time but not stored with timestamps, so they
// cannot be reconstructed per week and are excluded from the board.
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const start = weekStart();

    // 1. Focus XP — exact amounts already stored on completed sessions.
    const focusXp = await StudySession.aggregate([
      { $match: { status: 'completed', kind: 'focus', startedAt: { $gte: start } } },
      { $group: { _id: '$user', xp: { $sum: '$xpAwarded' } } }
    ]);

    // 2. Quiz XP — recompute from submissions: 30 base + 50 if perfect,
    // counting only the first attempt per quiz per calendar day.
    const quizXp = await QuizSubmission.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: {
            user: '$user',
            quiz: '$quiz',
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          score: { $first: '$score' }
        }
      },
      {
        $group: {
          _id: '$_id.user',
          xp: {
            $sum: {
              $add: [30, { $cond: [{ $eq: ['$score', 100] }, 50, 0] }]
            }
          }
        }
      }
    ]);

    // 3. Merge both sources per user.
    const totals = new Map();
    for (const row of [...focusXp, ...quizXp]) {
      const id = row._id.toString();
      totals.set(id, (totals.get(id) || 0) + row.xp);
    }

    const myId = String(req.user.id);
    // Always include the requester in the name lookup so "me" has a name
    // even with zero weekly XP.
    const lookupIds = new Set([...totals.keys(), myId]);

    const users = await User.find({
      _id: { $in: [...lookupIds].map((id) => new mongoose.Types.ObjectId(id)) }
    }).select('name').lean();
    const names = new Map(users.map((u) => [u._id.toString(), u.name]));

    if (totals.size === 0) {
      const meEmpty = { userId: myId, name: names.get(myId) || 'You', xp: 0, rank: null };
      return res.json({ success: true, weekStart: start, leaders: [], me: meEmpty });
    }

    const ranked = [...totals.entries()]
      .map(([userId, xp]) => ({ userId, name: names.get(userId) || 'Learner', xp }))
      .sort((a, b) => b.xp - a.xp);

    const leaders = ranked.slice(0, 20).map((r, i) => ({ ...r, rank: i + 1 }));

    const myIndex = ranked.findIndex((r) => r.userId === myId);
    const me = myIndex >= 0
      ? { ...ranked[myIndex], rank: myIndex + 1 }
      : { userId: myId, name: names.get(myId) || 'You', xp: 0, rank: null };

    res.json({ success: true, weekStart: start, leaders, me });
  } catch (error) {
    console.error('Weekly leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

module.exports = router;
