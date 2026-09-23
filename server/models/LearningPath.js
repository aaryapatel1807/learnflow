const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  estimatedDuration: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LearningPath', learningPathSchema);
