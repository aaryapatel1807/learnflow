const express = require('express');
const Note = require('../models/Note');
const Chapter = require('../models/Chapter');
const Book = require('../models/Book');
const Subject = require('../models/Subject');

const router = express.Router();

// Create a note
router.post('/', async (req, res) => {
  try {
    const { userId, contentType, contentId, text } = req.body;

    if (!userId || !contentType || !contentId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const note = await Note.create({
      userId,
      contentType,
      contentId,
      text
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all notes for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const notes = await Note.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Populate content details and group by subject
    const notesWithContent = [];

    for (const note of notes) {
      let contentDetails = null;
      let subjectId = null;
      let subjectName = null;

      if (note.contentType === 'chapter') {
        const chapter = await Chapter.findById(note.contentId)
          .populate('book')
          .lean();
        
        if (chapter && chapter.book) {
          contentDetails = {
            title: chapter.title,
            bookTitle: chapter.book.title,
            chapterNumber: chapter.chapterNumber
          };
          subjectId = chapter.book.subject;
          
          const subject = await Subject.findById(subjectId).lean();
          subjectName = subject ? subject.name : 'Unknown Subject';
        }
      } else if (note.contentType === 'topic') {
        // Topic handling can be added when topics are implemented
        contentDetails = { title: 'Topic' };
        subjectName = 'General';
      }

      if (contentDetails) {
        notesWithContent.push({
          ...note,
          contentDetails,
          subjectName
        });
      }
    }

    // Group by subject
    const groupedNotes = notesWithContent.reduce((acc, note) => {
      const subject = note.subjectName || 'Other';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(note);
      return acc;
    }, {});

    res.json(groupedNotes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update a note
router.put('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const note = await Note.findByIdAndUpdate(
      noteId,
      { text },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a note
router.delete('/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findByIdAndDelete(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
