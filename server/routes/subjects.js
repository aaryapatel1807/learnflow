const express = require('express');
const Subject = require('../models/Subject');
const Book = require('../models/Book');
const { 
  validateRequiredFields, 
  validateStringLength,
  sanitizeInput 
} = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all subjects with book counts (public)
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    
    // Add book count to each subject
    const subjectsWithCount = await Promise.all(
      subjects.map(async (subject) => {
        const bookCount = await Book.countDocuments({ subject: subject._id });
        return {
          _id: subject._id,
          name: subject.name,
          description: subject.description,
          bookCount,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt
        };
      })
    );

    res.json({
      success: true,
      count: subjectsWithCount.length,
      data: subjectsWithCount
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// Get single subject by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false,
        message: 'Subject not found' 
      });
    }

    const bookCount = await Book.countDocuments({ subject: subject._id });

    res.json({
      success: true,
      data: {
        ...subject.toObject(),
        bookCount
      }
    });
  } catch (error) {
    console.error('Get subject error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid subject ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// Create new subject (admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  sanitizeInput(),
  validateRequiredFields(['name']),
  validateStringLength('name', 2, 100),
  validateStringLength('description', 0, 500),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      // Check if subject already exists
      const existingSubject = await Subject.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (existingSubject) {
        return res.status(400).json({ 
          success: false,
          message: 'Subject with this name already exists' 
        });
      }

      // Create subject
      const subject = new Subject({
        name,
        description: description || ''
      });

      await subject.save();

      res.status(201).json({
        success: true,
        data: subject
      });
    } catch (error) {
      console.error('Create subject error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Subject with this name already exists' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Update subject (admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  sanitizeInput(),
  validateStringLength('name', 2, 100),
  validateStringLength('description', 0, 500),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      // Find subject
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({ 
          success: false,
          message: 'Subject not found' 
        });
      }

      // Check for duplicate name if name is being updated
      if (name && name !== subject.name) {
        const existingSubject = await Subject.findOne({ 
          name: new RegExp(`^${name}$`, 'i'),
          _id: { $ne: req.params.id }
        });
        if (existingSubject) {
          return res.status(400).json({ 
            success: false,
            message: 'Another subject with this name already exists' 
          });
        }
        subject.name = name;
      }

      // Update description if provided
      if (description !== undefined) {
        subject.description = description;
      }

      await subject.save();

      res.json({
        success: true,
        data: subject
      });
    } catch (error) {
      console.error('Update subject error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid subject ID format' 
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Another subject with this name already exists' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Delete subject (admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      // Check if subject has books
      const bookCount = await Book.countDocuments({ subject: req.params.id });
      if (bookCount > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot delete subject that has books. Remove or reassign books first.' 
        });
      }

      const subject = await Subject.findByIdAndDelete(req.params.id);
      
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
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid subject ID format' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

module.exports = router;
