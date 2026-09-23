const express = require('express');
const Quiz = require('../../models/Quiz');
const QuizQuestion = require('../../models/QuizQuestion');
const Subject = require('../../models/Subject');

const router = express.Router();

// GET /api/admin/quizzes - Get all quizzes with question count
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('subject', 'name')
      .sort({ title: 1 });

    // Add question count to each quiz
    const quizzesWithDetails = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await QuizQuestion.countDocuments({ quiz: quiz._id });
        return {
          ...quiz.toObject(),
          questionCount
        };
      })
    );

    res.json(quizzesWithDetails);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/admin/quizzes/:id - Get single quiz with questions
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id).populate('subject', 'name');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const questions = await QuizQuestion.find({ quiz: id }).sort('order');

    res.json({
      ...quiz.toObject(),
      questions
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/admin/quizzes - Create a new quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, topic, subject, difficulty } = req.body;

    if (!title || !topic || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, topic, and subject are required'
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

    const quiz = await Quiz.create({
      title,
      description: description || '',
      topic,
      subject,
      difficulty: difficulty || 'Beginner'
    });

    const populatedQuiz = await Quiz.findById(quiz._id).populate('subject', 'name');

    res.status(201).json({
      success: true,
      quiz: populatedQuiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/quizzes/:id - Update a quiz
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, topic, subject, difficulty } = req.body;

    if (!title || !topic || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Title, topic, and subject are required'
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

    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { title, description, topic, subject, difficulty },
      { new: true, runValidators: true }
    ).populate('subject', 'name');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/quizzes/:id - Delete a quiz
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all questions associated with this quiz
    await QuizQuestion.deleteMany({ quiz: id });

    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      message: 'Quiz and its questions deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ====== QUESTION MANAGEMENT ======

// POST /api/admin/quizzes/:quizId/questions - Add a question to a quiz
router.post('/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionText, options, correctOptionIndex, topic, order } = req.body;

    if (!questionText || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Question text and at least 2 options are required'
      });
    }

    if (correctOptionIndex === undefined || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      return res.status(400).json({
        success: false,
        message: 'Valid correct option index is required'
      });
    }

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const question = await QuizQuestion.create({
      quiz: quizId,
      questionText,
      options,
      correctOptionIndex,
      topic,
      order: order || 0
    });

    res.status(201).json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/quizzes/:quizId/questions/:questionId - Update a question
router.put('/:quizId/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { questionText, options, correctOptionIndex, topic, order } = req.body;

    if (!questionText || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Question text and at least 2 options are required'
      });
    }

    if (correctOptionIndex === undefined || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      return res.status(400).json({
        success: false,
        message: 'Valid correct option index is required'
      });
    }

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const question = await QuizQuestion.findByIdAndUpdate(
      questionId,
      { questionText, options, correctOptionIndex, topic, order },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/admin/quizzes/:quizId/questions/:questionId - Delete a question
router.delete('/:quizId/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await QuizQuestion.findByIdAndDelete(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/admin/quizzes/:quizId/questions/reorder - Reorder questions
router.put('/:quizId/questions/reorder', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questions } = req.body; // Array of { questionId, order }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required'
      });
    }

    // Update each question's order
    const updatePromises = questions.map(({ questionId, order }) =>
      QuizQuestion.findByIdAndUpdate(questionId, { order })
    );

    await Promise.all(updatePromises);

    const updatedQuestions = await QuizQuestion.find({ quiz: quizId }).sort('order');

    res.json({
      success: true,
      questions: updatedQuestions
    });
  } catch (error) {
    console.error('Reorder questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
