import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './QuizTake.css';

function QuizTake() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quizzes/${quizId}`);
        setQuiz(response.data);
        setAnswers(new Array(response.data.questions.length).fill(null));
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (optionIndex) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setAnswers(newAnswers);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(newAnswers[currentQuestionIndex + 1]);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[currentQuestionIndex - 1]);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      const submissionData = {
        userId: user.id,
        quizId: quizId,
        answers: finalAnswers.map((selectedOption, index) => ({
          questionId: quiz.questions[index]._id,
          selectedOption
        }))
      };
      const response = await api.post('/quiz/submit', submissionData);
      setResult(response.data);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  if (loading) return <div className="container"><div className="loading-state"><div className="spinner" /><span>Loading quiz…</span></div></div>;
  if (!quiz) return <div className="container">Quiz not found</div>;

  if (submitted && result) {
    return (
      <div className="container quiz-take">
        <div className="result-card">
          <div className="result-header">
            <h1>Quiz Complete!</h1>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{result.score}%</span>
              </div>
            </div>
          </div>

          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">Correct Answers</span>
              <span className="stat-value">{result.correctAnswers} / {result.totalQuestions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">XP Earned</span>
              <span className="stat-value xp-earned">💎 +{result.xpEarned} XP</span>
            </div>
          </div>

          <div className="recommendation">
            <h3>📝 Recommendation</h3>
            <p>{result.recommendation}</p>
          </div>

          <div className="result-actions">
            <button onClick={() => navigate('/quizzes')} className="btn btn-primary">Back to Quizzes</button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="container quiz-take">
      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="progress-text">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
      </div>

      <div className="question-card">
        <h2>{currentQuestion.questionText}</h2>

        <div className="options-list">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`option-item ${selectedOption === index ? 'selected' : ''}`}
              onClick={() => handleSelectOption(index)}
            >
              <div className="option-radio">
                {selectedOption === index && <div className="radio-selected"></div>}
              </div>
              <span className="option-text">{option}</span>
            </div>
          ))}
        </div>

        <div className="question-actions">
          <button onClick={handlePreviousQuestion} className="btn btn-secondary" disabled={currentQuestionIndex === 0}>
            Previous
          </button>
          <button onClick={handleNextQuestion} className="btn btn-primary" disabled={selectedOption === null}>
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizTake;
