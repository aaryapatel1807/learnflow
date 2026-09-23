/**
 * Chapter Management Routes
 * Handles CRUD operations for book chapters
 */

const express = require('express');
const Chapter = require('../models/Chapter');
const Book = require('../models/Book');
const { 
  validateRequiredFields, 
  validateStringLength,
  validateNumericRange,
  validateObjectId,
  sanitizeInput 
} = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all chapters for a specific book (public)
router.get('/book/:bookId', validateObjectId('bookId'), async (req, res) => {
  try {
    // Check if book exists
    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found' 
      });
    }

    const chapters = await Chapter.find({ book: req.params.bookId })
      .sort('chapterNumber')
      .select('-content'); // Don't include full content in list view

    res.json({
      success: true,
      count: chapters.length,
      data: chapters,
      bookInfo: {
        id: book._id,
        title: book.title,
        author: book.author
      }
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// Get single chapter by ID with full content (public)
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('book', 'title author subject difficulty');
    
    if (!chapter) {
      return res.status(404).json({ 
        success: false,
        message: 'Chapter not found' 
      });
    }

    res.json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// Create new chapter (admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  sanitizeInput(),
  validateRequiredFields(['book', 'chapterNumber', 'title', 'content']),
  validateObjectId('book'),
  validateNumericRange('chapterNumber', 1, 999),
  validateStringLength('title', 2, 200),
  validateNumericRange('pages', 1, 1000),
  async (req, res) => {
    try {
      const { book, chapterNumber, title, content, pages } = req.body;

      // Check if book exists
      const bookExists = await Book.findById(book);
      if (!bookExists) {
        return res.status(404).json({ 
          success: false,
          message: 'Book not found' 
        });
      }

      // Check for duplicate chapter number in the same book
      const existingChapter = await Chapter.findOne({ 
        book, 
        chapterNumber 
      });
      
      if (existingChapter) {
        return res.status(400).json({ 
          success: false,
          message: `Chapter ${chapterNumber} already exists in this book` 
        });
      }

      // Create chapter
      const chapter = new Chapter({
        book,
        chapterNumber,
        title,
        content,
        pages: pages || 1
      });

      await chapter.save();

      // Populate book info for response
      await chapter.populate('book', 'title author');

      res.status(201).json({
        success: true,
        data: chapter
      });
    } catch (error) {
      console.error('Create chapter error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid book ID format' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Update chapter (admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  sanitizeInput(),
  validateObjectId('id'),
  validateNumericRange('chapterNumber', 1, 999),
  validateStringLength('title', 2, 200),
  validateNumericRange('pages', 1, 1000),
  async (req, res) => {
    try {
      const { chapterNumber, title, content, pages } = req.body;

      // Find chapter
      const chapter = await Chapter.findById(req.params.id);
      if (!chapter) {
        return res.status(404).json({ 
          success: false,
          message: 'Chapter not found' 
        });
      }

      // Check for duplicate chapter number if changing
      if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
        const existingChapter = await Chapter.findOne({ 
          book: chapter.book,
          chapterNumber,
          _id: { $ne: req.params.id }
        });
        
        if (existingChapter) {
          return res.status(400).json({ 
            success: false,
            message: `Chapter ${chapterNumber} already exists in this book` 
          });
        }
        chapter.chapterNumber = chapterNumber;
      }

      // Update other fields if provided
      if (title !== undefined) chapter.title = title;
      if (content !== undefined) chapter.content = content;
      if (pages !== undefined) chapter.pages = pages;

      await chapter.save();

      // Populate book info for response
      await chapter.populate('book', 'title author');

      res.json({
        success: true,
        data: chapter
      });
    } catch (error) {
      console.error('Update chapter error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid chapter ID format' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Delete chapter (admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateObjectId('id'),
  async (req, res) => {
    try {
      const chapter = await Chapter.findByIdAndDelete(req.params.id);
      
      if (!chapter) {
        return res.status(404).json({ 
          success: false,
          message: 'Chapter not found' 
        });
      }

      res.json({
        success: true,
        message: 'Chapter deleted successfully',
        data: {
          id: chapter._id,
          title: chapter.title,
          chapterNumber: chapter.chapterNumber
        }
      });
    } catch (error) {
      console.error('Delete chapter error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid chapter ID format' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Get chapter count for a book
router.get('/book/:bookId/count', validateObjectId('bookId'), async (req, res) => {
  try {
    const count = await Chapter.countDocuments({ book: req.params.bookId });
    
    res.json({
      success: true,
      data: {
        bookId: req.params.bookId,
        chapterCount: count
      }
    });
  } catch (error) {
    console.error('Get chapter count error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

module.exports = router;