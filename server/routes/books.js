const express = require('express');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const { 
  validateRequiredFields, 
  validateStringLength,
  validateObjectId,
  sanitizeInput 
} = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all books with filtering and pagination (public)
router.get('/', async (req, res) => {
  try {
    const { 
      subject, 
      difficulty, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = {};
    
    // Filter by subject
    if (subject && subject !== 'all') {
      query.subject = subject;
    }
    
    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    
    // Search by title or author
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [books, totalBooks] = await Promise.all([
      Book.find(query)
        .populate('subject', 'name')
        .sort({ title: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Book.countDocuments(query)
    ]);
    
    // Add chapter count to each book
    const booksWithDetails = await Promise.all(
      books.map(async (book) => {
        const chapterCount = await Chapter.countDocuments({ book: book._id });
        return {
          ...book.toObject(),
          chapterCount
        };
      })
    );

    res.json({
      success: true,
      count: booksWithDetails.length,
      total: totalBooks,
      page: parseInt(page),
      totalPages: Math.ceil(totalBooks / parseInt(limit)),
      data: booksWithDetails
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// Get single book with chapters (public)
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('subject', 'name description');
    
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found' 
      });
    }

    const chapters = await Chapter.find({ book: req.params.id })
      .sort('chapterNumber')
      .select('-content'); // Don't include full content in book view

    // Get related books in same subject
    const relatedBooks = await Book.find({ 
      subject: book.subject,
      _id: { $ne: book._id }
    })
      .limit(4)
      .select('title author coverImage difficulty');

    res.json({
      success: true,
      data: {
        ...book.toObject(),
        chapters,
        relatedBooks
      }
    });
  } catch (error) {
    console.error('Get book error:', error);
    
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
});

// Create new book (admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  sanitizeInput(),
  validateRequiredFields(['title', 'author', 'subject']),
  validateStringLength('title', 2, 200),
  validateStringLength('author', 2, 100),
  validateStringLength('description', 0, 1000),
  validateObjectId('subject'),
  async (req, res) => {
    try {
      const { title, author, subject, difficulty, description, coverImage } = req.body;

      // Check if subject exists
      const subjectExists = await Subject.findById(subject);
      if (!subjectExists) {
        return res.status(404).json({ 
          success: false,
          message: 'Subject not found' 
        });
      }

      // Check for duplicate book title in same subject
      const existingBook = await Book.findOne({ 
        title: new RegExp(`^${title}$`, 'i'),
        subject 
      });
      
      if (existingBook) {
        return res.status(400).json({ 
          success: false,
          message: 'Book with this title already exists in this subject' 
        });
      }

      // Create book
      const book = new Book({
        title,
        author,
        subject,
        difficulty: difficulty || 'Beginner',
        description: description || '',
        coverImage: coverImage || ''
      });

      await book.save();

      // Populate subject for response
      await book.populate('subject', 'name');

      res.status(201).json({
        success: true,
        data: book
      });
    } catch (error) {
      console.error('Create book error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid subject ID format' 
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Duplicate book entry' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Update book (admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  sanitizeInput(),
  validateObjectId('id'),
  validateStringLength('title', 2, 200),
  validateStringLength('author', 2, 100),
  validateStringLength('description', 0, 1000),
  async (req, res) => {
    try {
      const { title, author, subject, difficulty, description, coverImage } = req.body;

      // Find book
      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ 
          success: false,
          message: 'Book not found' 
        });
      }

      // Check if subject exists (if being updated)
      if (subject && subject !== book.subject.toString()) {
        const subjectExists = await Subject.findById(subject);
        if (!subjectExists) {
          return res.status(404).json({ 
            success: false,
            message: 'Subject not found' 
          });
        }
        book.subject = subject;
      }

      // Check for duplicate title if title is being updated
      if (title && title !== book.title) {
        const existingBook = await Book.findOne({ 
          title: new RegExp(`^${title}$`, 'i'),
          subject: subject || book.subject,
          _id: { $ne: req.params.id }
        });
        
        if (existingBook) {
          return res.status(400).json({ 
            success: false,
            message: 'Another book with this title already exists in this subject' 
          });
        }
        book.title = title;
      }

      // Update other fields if provided
      if (author !== undefined) book.author = author;
      if (difficulty !== undefined) book.difficulty = difficulty;
      if (description !== undefined) book.description = description;
      if (coverImage !== undefined) book.coverImage = coverImage;

      await book.save();

      // Populate subject for response
      await book.populate('subject', 'name');

      res.json({
        success: true,
        data: book
      });
    } catch (error) {
      console.error('Update book error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid book ID format' 
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Duplicate book entry' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Delete book (admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  validateObjectId('id'),
  async (req, res) => {
    try {
      // Check if book has chapters
      const chapterCount = await Chapter.countDocuments({ book: req.params.id });
      if (chapterCount > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot delete book that has chapters. Delete chapters first.' 
        });
      }

      // Check if book has progress records
      const Progress = require('../models/Progress');
      const progressCount = await Progress.countDocuments({ book: req.params.id });
      if (progressCount > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot delete book that has progress records. Clear progress first.' 
        });
      }

      const book = await Book.findByIdAndDelete(req.params.id);
      
      if (!book) {
        return res.status(404).json({ 
          success: false,
          message: 'Book not found' 
        });
      }

      res.json({
        success: true,
        message: 'Book deleted successfully',
        data: {
          id: book._id,
          title: book.title,
          author: book.author
        }
      });
    } catch (error) {
      console.error('Delete book error:', error);
      
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

// Get book statistics
router.get('/:id/stats', validateObjectId('id'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found' 
      });
    }

    const [chapterCount, totalPages] = await Promise.all([
      Chapter.countDocuments({ book: req.params.id }),
      Chapter.aggregate([
        { $match: { book: book._id } },
        { $group: { _id: null, total: { $sum: '$pages' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        bookId: book._id,
        title: book.title,
        chapterCount,
        totalPages: totalPages.length > 0 ? totalPages[0].total : 0,
        difficulty: book.difficulty,
        subject: book.subject
      }
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

module.exports = router;
