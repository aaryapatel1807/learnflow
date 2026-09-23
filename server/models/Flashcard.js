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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
