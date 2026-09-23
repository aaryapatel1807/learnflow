const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
