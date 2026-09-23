const express = require('express');
const Book = require('../../models/Book');
const Chapter = require('../../models/Chapter');
const Subject = require('../../models/Subject');

const router = express.Router();

// GET /api/admin/books - Get all books with chapter count
router.get('/', async (req, res) => {
  try {
    const books = await Book.find()
      .populate('subject', 'name')
      .sort({ title: 1 });

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

    res.json(booksWithDetails);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/admin/books/:id - Get single book with chapters
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id).populate('subject', 'name');
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const chapters = await Chapter.find({ book: id }).sort('chapterNumber');

    res.json({
      ...book.toObject(),
      chapters
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/admin/books - Create a new book
router.post('/', async (req, res) => {
  try {
    const { title, author, subject, difficulty, description, coverImage } = req.body;

    if (!title || !author || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, and subject are required'
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

    const book = await Book.create({
      title,
      author,
      subject,
      difficulty: difficulty || 'Beginner',
      description: description || '',
      coverImage: coverImage || ''
    });

    const populatedBook = await Book.findById(book._id).populate('subject', 'name');

    res.status(201).json({
      success: true,
      book: populatedBook
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/books/:id - Update a book
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, subject, difficulty, description, coverImage } = req.body;

    if (!title || !author || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, and subject are required'
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

    const book = await Book.findByIdAndUpdate(
      id,
      { title, author, subject, difficulty, description, coverImage },
      { new: true, runValidators: true }
    ).populate('subject', 'name');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      book
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/books/:id - Delete a book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all chapters associated with this book
    await Chapter.deleteMany({ book: id });

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book and its chapters deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ====== CHAPTER MANAGEMENT ======

// POST /api/admin/books/:bookId/chapters - Add a chapter to a book
router.post('/:bookId/chapters', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { chapterNumber, title, content, pages } = req.body;

    if (!chapterNumber || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Chapter number, title, and content are required'
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if chapter number already exists
    const existingChapter = await Chapter.findOne({ book: bookId, chapterNumber });
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: `Chapter ${chapterNumber} already exists for this book`
      });
    }

    const chapter = await Chapter.create({
      book: bookId,
      chapterNumber,
      title,
      content,
      pages: pages || 1
    });

    res.status(201).json({
      success: true,
      chapter
    });
  } catch (error) {
    console.error('Create chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/books/:bookId/chapters/:chapterId - Update a chapter
router.put('/:bookId/chapters/:chapterId', async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    const { chapterNumber, title, content, pages } = req.body;

    if (!chapterNumber || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Chapter number, title, and content are required'
      });
    }

    // Check if another chapter has this number
    const existingChapter = await Chapter.findOne({
      book: bookId,
      chapterNumber,
      _id: { $ne: chapterId }
    });

    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: `Another chapter with number ${chapterNumber} already exists for this book`
      });
    }

    const chapter = await Chapter.findByIdAndUpdate(
      chapterId,
      { chapterNumber, title, content, pages },
      { new: true, runValidators: true }
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    res.json({
      success: true,
      chapter
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/books/:bookId/chapters/:chapterId - Delete a chapter
router.delete('/:bookId/chapters/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findByIdAndDelete(chapterId);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    res.json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    console.error('Delete chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/books/:bookId/chapters/reorder - Reorder chapters
router.put('/:bookId/chapters/reorder', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { chapters } = req.body; // Array of { chapterId, chapterNumber }

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Chapters array is required'
      });
    }

    // Update each chapter's number
    const updatePromises = chapters.map(({ chapterId, chapterNumber }) =>
      Chapter.findByIdAndUpdate(chapterId, { chapterNumber })
    );

    await Promise.all(updatePromises);

    const updatedChapters = await Chapter.find({ book: bookId }).sort('chapterNumber');

    res.json({
      success: true,
      chapters: updatedChapters
    });
  } catch (error) {
    console.error('Reorder chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
