const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
  validateRequiredFields, 
  validateEmail, 
  validatePassword,
  sanitizeInput 
} = require('../middleware/validation');

const router = express.Router();

// Register
router.post(
  '/register',
  sanitizeInput(),
  validateRequiredFields(['name', 'email', 'password']),
  validateEmail(),
  validatePassword(6),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword
      });

      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Login
router.post(
  '/login',
  sanitizeInput(),
  validateRequiredFields(['email', 'password']),
  validateEmail(),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid email or password' 
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid email or password' 
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error. Please try again later.' 
      });
    }
  }
);

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    // Note: This route should be protected with authenticateToken middleware
    // when called from server.js
    res.json({
      success: true,
      message: 'User profile endpoint - protect with authenticateToken middleware'
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get user stats (XP, streak, etc.)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('name email xp currentStreak longestStreak lastActivityDate');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
