const express = require('express');
const StudySession = require('../models/StudySession');
const User = require('../models/User');
const { updateUserStreak } = require('./flashcards');

const router = express.Router();

// XP: 2 XP per 5 completed focus minutes (a 25-min Pomodoro = 10 XP).
function xpForFocus(minutes) {
  return Math.floor(minutes / 5) * 2;
}

// POST /api/study/sessions - start a session
router.post('/sessions', async (req, res) => {
  try {
    const { userId, kind = 'focus', plannedMinutes, subjectId, label } = req.body;
    if (!userId || !plannedMinutes) {
      return res.status(400).json({ message: 'userId and plannedMinutes are required' });
    }
    if (!['focus', 'short-break', 'long-break'].includes(kind)) {
      return res.status(400).json({ message: 'Invalid session kind' });
    }

    // Abandon any stale running sessions for this user (e.g. closed tab)
    await StudySession.updateMany(
      { user: userId, status: 'running' },
      { status: 'abandoned', endedAt: new Date() }
    );

    const session = new StudySession({
      user: userId,
      kind,
      plannedMinutes,
      subject: subjectId || null,
      label: label || ''
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Start study session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study/sessions/:id/complete - finish a session
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    const { userId, actualMinutes } = req.body;
    const session = await StudySession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not your session' });
    }
    if (session.status !== 'running') {
      return res.status(400).json({ message: 'Session is not running' });
    }

    const minutes = Math.max(0, Math.min(actualMinutes ?? session.plannedMinutes, session.plannedMinutes));
    session.actualMinutes = minutes;
    session.status = 'completed';
    session.endedAt = new Date();

    let xp = 0;
    if (session.kind === 'focus' && minutes >= 5) {
      xp = xpForFocus(minutes);
      const user = await User.findById(userId);
      if (user) {
        user.xp += xp;
        await user.save();
      }
      await updateUserStreak(userId);
    }
    session.xpAwarded = xp;
    await session.save();

    res.json({ session, xpEarned: xp });
  } catch (error) {
    console.error('Complete study session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study/sessions/:id/abandon - give up on a session
router.post('/sessions/:id/abandon', async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await StudySession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not your session' });
    }
    if (session.status !== 'running') {
      return res.status(400).json({ message: 'Session is not running' });
    }
    session.status = 'abandoned';
    session.endedAt = new Date();
    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Abandon study session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/study/stats/:userId - focus stats for the last N days
router.get('/stats/:userId', async (req, res) => {
  try {
    const days = Math.min(30, Math.max(1, parseInt(req.query.days, 10) || 7));
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const sessions = await StudySession.find({
      user: req.params.userId,
      status: 'completed',
      kind: 'focus',
      startedAt: { $gte: since }
    }).lean();

    const perDay = {};
    let totalMinutes = 0;
    let totalSessions = 0;
    for (const s of sessions) {
      const key = new Date(s.startedAt).toISOString().split('T')[0];
      perDay[key] = perDay[key] || { minutes: 0, sessions: 0 };
      perDay[key].minutes += s.actualMinutes;
      perDay[key].sessions += 1;
      totalMinutes += s.actualMinutes;
      totalSessions += 1;
    }

    res.json({ days, totalMinutes, totalSessions, perDay });
  } catch (error) {
    console.error('Study stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
