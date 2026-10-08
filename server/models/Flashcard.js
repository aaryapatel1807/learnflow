const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  front: {
    type: String,
    required: true,
    trim: true
  },
  back: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  // Card type: 'basic' (front/back) or 'cloze' (fill-in-the-blank).
  cardType: {
    type: String,
    enum: ['basic', 'cloze'],
    default: 'basic'
  },
  // Raw text with {{c1::answer}} markup (cloze cards only). The client
  // renders blanks from this + clozeOrdinal; front/back hold plain fallbacks.
  clozeText: {
    type: String,
    default: ''
  },
  // Which cloze ordinal this card blanks out (cloze cards only).
  clozeOrdinal: {
    type: Number,
    default: null
  },
  // Where the card came from: 'manual' (seeded/admin), 'note-cloze'
  // (generated from a note's cloze markup), 'quiz-miss' (auto-created from
  // a wrong quiz answer).
  sourceType: {
    type: String,
    enum: ['manual', 'note-cloze', 'quiz-miss'],
    default: 'manual'
  },
  // Polymorphic reference to the source document (Note / QuizQuestion).
  sourceRef: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Deduplication key, e.g. 'cloze:<noteId>:<ordinal>' or
  // 'quizmiss:<userId>:<questionId>'. Unique + sparse so repeat generation
  // never creates duplicate cards.
  sourceKey: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  // Free-form context (e.g. quiz-miss: { quizId, quizTitle, questionId,
  // options, selectedOptionIndex, correctOptionIndex }).
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
