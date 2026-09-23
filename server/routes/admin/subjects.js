const express = require('express');
const Subject = require('../../models/Subject');
const Book = require('../../models/Book');

const router = express.Router();

// GET /api/admin/subjects - Get all subjects with book count
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    
    // Add book count to each subject
    const subjectsWithDetails = await Promise.all(
      subjects.map(async (subject) => {
        const bookCount = await Book.countDocuments({ subject: subject._id });
        return {
          ...subject.toObject(),
          bookCount
        };
      })
    );

    res.json(subjectsWithDetails);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/admin/subjects - Create a new subject
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'A subject with this name already exists'
      });
    }

    const subject = await Subject.create({ name, description });

    res.status(201).json({
      success: true,
      subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/subjects/:id - Update a subject
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }

    // Check if another subject has this name
    const existingSubject = await Subject.findOne({ 
      name, 
      _id: { $ne: id } 
    });
    
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Another subject with this name already exists'
      });
    }

    const subject = await Subject.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/subjects/:id - Delete a subject
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subject has books
    const bookCount = await Book.countDocuments({ subject: id });
    if (bookCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject. It has ${bookCount} book(s) associated with it. Delete the books first.`
      });
    }

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
