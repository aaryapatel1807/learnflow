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
      <div className="container">
        <div className="pp-panel qt-result">
          <p className="pp-eyebrow">Results</p>
          <h1 className="pp-title">Quiz Complete!</h1>
          <div className="qt-score">
            <div className="qt-score-circle">
              <span>{result.score}%</span>
            </div>
          </div>

          <div className="pp-cards">
            <div className="pp-card pp-mint">
              <span className="pp-card-label">Correct Answers</span>
              <span className="pp-card-value">{result.correctAnswers}<small>/{result.totalQuestions}</small></span>
            </div>
            <div className="pp-card pp-violet">
              <span className="pp-card-label">XP Earned</span>
              <span className="pp-card-value">💎 +{result.xpEarned}</span>
            </div>
          </div>

          <div className="pp-panel qt-reco">
            <h2>📝 Recommendation</h2>
            <p>{result.recommendation}</p>
          </div>

          <div className="qt-actions">
            <button onClick={() => navigate('/quizzes')} className="btn btn-primary">Back to Quizzes</button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="container">
      <div className="pp-panel">
        <div className="pp-progress-head">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="pp-progress" style={{ marginBottom: 0 }}>
          <div className="pp-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="pp-panel">
        <h2 className="qt-question">{currentQuestion.questionText}</h2>

        <div className="qt-options">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`qt-option ${selectedOption === index ? 'selected' : ''}`}
              onClick={() => handleSelectOption(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectOption(index)}
            >
              <div className="qt-option-radio">
                {selectedOption === index && <div className="qt-radio-dot"></div>}
              </div>
              <span>{option}</span>
            </div>
          ))}
        </div>

        <div className="qt-actions">
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
