const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, authorizeUserOrAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

const router = express.Router();

// IANA timezone validator (no extra deps — Intl throws RangeError on unknown zones).
const isValidTimezone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
};

// Register — Joi schema validation (AWD Task-3) replaces the hand-rolled
// checks: it enforces types (blocking NoSQL operator injection), formats,
// length limits, and strips unknown fields such as a smuggled "role".
router.post(
  '/register',
  validate(registerSchema),
  async (req, res) => {
    try {
      const { name, email, password, timezone } = req.body;

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
        password: hashedPassword,
        // Optional client-detected timezone; invalid values are ignored (never block signup).
        ...(isValidTimezone(timezone) ? { timezone } : {})
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
          role: user.role,
          timezone: user.timezone
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

// Login — same Joi protection as register.
router.post(
  '/login',
  validate(loginSchema),
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
          role: user.role,
          timezone: user.timezone
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
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Update current user's timezone (also served at PATCH /api/users/me/timezone
// since this router is mounted on both /api/auth and /api/users).
router.patch('/me/timezone', authenticateToken, async (req, res) => {
  try {
    const { timezone } = req.body;
    if (!isValidTimezone(timezone)) {
      return res.status(400).json({
        success: false,
        message: 'A valid IANA timezone is required (e.g. Asia/Kolkata).'
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { timezone },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, timezone: user.timezone });
  } catch (error) {
    console.error('Update timezone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user stats (XP, streak, etc.)
router.get('/:userId', authenticateToken, authorizeUserOrAdmin('userId'), async (req, res) => {
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
