const express = require('express');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizSubmission = require('../models/QuizSubmission');
const User = require('../models/User');
const { updateUserStreak } = require('./flashcards');

const router = express.Router();

// GET /api/quizzes - Get all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('subject', 'name');
    
    // Add question count to each quiz
    const quizzesWithCount = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await QuizQuestion.countDocuments({ quiz: quiz._id });
        return {
          ...quiz.toObject(),
          questionCount
        };
      })
    );
    
    res.json(quizzesWithCount);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/quizzes/:id - Get quiz with questions
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('subject', 'name');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const questions = await QuizQuestion.find({ quiz: req.params.id }).sort('order');
    
    // Don't send correct answers to client
    const questionsWithoutAnswers = questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
      order: q.order
    }));
    
    res.json({
      ...quiz.toObject(),
      questions: questionsWithoutAnswers
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/quiz/submit - Submit quiz answers
router.post('/submit', async (req, res) => {
  try {
    const { userId, quizId, answers } = req.body;
    
    if (!userId || !quizId || !answers) {
      return res.status(400).json({ message: 'userId, quizId, and answers are required' });
    }
    
    // Get quiz questions with correct answers
    const questions = await QuizQuestion.find({ quiz: quizId });
    
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Quiz questions not found' });
    }
    
    // Grade the submission
    let correctCount = 0;
    const gradedAnswers = [];
    const wrongTopics = [];
    
    questions.forEach((question) => {
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      const isCorrect = userAnswer && userAnswer.selectedOption === question.correctOptionIndex;
      
      if (isCorrect) {
        correctCount++;
      } else if (userAnswer) {
        wrongTopics.push(question.topic);
      }
      
      gradedAnswers.push({
        questionId: question._id,
        selectedOption: userAnswer ? userAnswer.selectedOption : -1,
        isCorrect
      });
    });
    
    const score = Math.round((correctCount / questions.length) * 100);
    
    // Save submission
    const submission = new QuizSubmission({
      user: userId,
      quiz: quizId,
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      answers: gradedAnswers
    });
    
    await submission.save();
    
    // Update user streak
    await updateUserStreak(userId);
    
    // Award XP
    const user = await User.findById(userId);
    let xpEarned = 30; // Base XP for completing quiz
    
    if (score === 100) {
      xpEarned += 50; // Bonus for perfect score
    }
    
    user.xp += xpEarned;
    await user.save();
    
    // Generate rule-based recommendation
    let recommendation = 'Great job!';
    if (wrongTopics.length > 0) {
      // Find most common wrong topic
      const topicCount = {};
      wrongTopics.forEach(topic => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      });
      
      const mostMissedTopic = Object.keys(topicCount).reduce((a, b) => 
        topicCount[a] > topicCount[b] ? a : b
      );
      
      recommendation = `Consider reviewing: ${mostMissedTopic}`;
    } else {
      recommendation = 'Perfect score! You\'ve mastered this topic!';
    }
    
    res.json({
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      xpEarned,
      recommendation,
      answers: gradedAnswers
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/quiz/submissions/:userId - Get user's quiz submissions
router.get('/submissions/:userId', async (req, res) => {
  try {
    const submissions = await QuizSubmission.find({ user: req.params.userId })
      .populate('quiz', 'title topic')
      .sort('-createdAt');
    
    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
