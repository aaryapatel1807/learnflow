const mongoose = require('mongoose');

// A single focus/break session (Pomodoro-style). Sessions are started from the
// client timer and completed/abandoned explicitly; only completed focus
// sessions award XP.
const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  kind: {
    type: String,
    enum: ['focus', 'short-break', 'long-break'],
    default: 'focus'
  },
  plannedMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  actualMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null
  },
  label: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'abandoned'],
    default: 'running',
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  xpAwarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

studySessionSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
