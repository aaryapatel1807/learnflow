const express = require('express');
const Flashcard = require('../../models/Flashcard');
const Subject = require('../../models/Subject');

const router = express.Router();

// GET /api/admin/flashcards - Get all flashcards
router.get('/', async (req, res) => {
  try {
    const { subject, topic } = req.query;

    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;

    const flashcards = await Flashcard.find(filter)
      .populate('subject', 'name')
      .sort({ topic: 1, createdAt: 1 });

    res.json(flashcards);
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/admin/flashcards/:id - Get single flashcard
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const flashcard = await Flashcard.findById(id).populate('subject', 'name');
    
    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    res.json(flashcard);
  } catch (error) {
    console.error('Get flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/admin/flashcards - Create a new flashcard
router.post('/', async (req, res) => {
  try {
    const { front, back, topic, subject } = req.body;

    if (!front || !back || !topic || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Front, back, topic, and subject are required'
      });
    }

    // Verify subject exists
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const flashcard = await Flashcard.create({
      front,
      back,
      topic,
      subject
    });

    const populatedFlashcard = await Flashcard.findById(flashcard._id).populate('subject', 'name');

    res.status(201).json({
      success: true,
      flashcard: populatedFlashcard
    });
  } catch (error) {
    console.error('Create flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/flashcards/:id - Update a flashcard
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { front, back, topic, subject } = req.body;

    if (!front || !back || !topic || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Front, back, topic, and subject are required'
      });
    }

    // Verify subject exists
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const flashcard = await Flashcard.findByIdAndUpdate(
      id,
      { front, back, topic, subject },
      { new: true, runValidators: true }
    ).populate('subject', 'name');

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    res.json({
      success: true,
      flashcard
    });
  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/flashcards/:id - Delete a flashcard
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const flashcard = await Flashcard.findByIdAndDelete(id);

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
