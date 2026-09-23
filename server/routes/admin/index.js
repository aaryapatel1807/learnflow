const express = require('express');
const { authenticateToken, isAdmin } = require('../../middleware/auth');

const subjectsRouter = require('./subjects');
const booksRouter = require('./books');
const learningPathsRouter = require('./learningPaths');
const roadmapsRouter = require('./roadmaps');
const quizzesRouter = require('./quizzes');
const flashcardsRouter = require('./flashcards');
const dashboardRouter = require('./dashboard');

const router = express.Router();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(isAdmin);

// Mount admin route modules
router.use('/dashboard', dashboardRouter);
router.use('/subjects', subjectsRouter);
router.use('/books', booksRouter);
router.use('/learning-paths', learningPathsRouter);
router.use('/roadmaps', roadmapsRouter);
router.use('/quizzes', quizzesRouter);
router.use('/flashcards', flashcardsRouter);

module.exports = router;
