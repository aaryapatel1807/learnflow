require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const bookRoutes = require('./routes/books');
const chapterRoutes = require('./routes/chapters');
const progressRoutes = require('./routes/progress');
const learningPathRoutes = require('./routes/learningPaths');
const roadmapRoutes = require('./routes/roadmaps');
const flashcardRoutes = require('./routes/flashcards');
const quizRoutes = require('./routes/quizzes');
const achievementRoutes = require('./routes/achievements');
const notesRoutes = require('./routes/notes');
const bookmarksRoutes = require('./routes/bookmarks');
const calendarRoutes = require('./routes/calendar');
const recommendationsRoutes = require('./routes/recommendations');
const skillTreeRoutes = require('./routes/skillTree');
const adminRoutes = require('./routes/admin');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for chapter content
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // User stats endpoint
app.use('/api/subjects', subjectRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/skill-tree', skillTreeRoutes);

// Admin routes (protected with authenticateToken + isAdmin middleware)
app.use('/api/admin', adminRoutes);

// Protected routes (require authentication)
app.use('/api/progress', authenticateToken, progressRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Academix API',
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Academix API',
    endpoints: {
      auth: '/api/auth',
      subjects: '/api/subjects',
      books: '/api/books',
      chapters: '/api/chapters',
      progress: '/api/progress',
      learningPaths: '/api/learning-paths',
      roadmaps: '/api/roadmaps',
      health: '/api/health'
    },
    documentation: 'See README.md for API documentation'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID format'
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnflow';

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
