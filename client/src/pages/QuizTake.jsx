import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './QuizTake.css';

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function QuizTake() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [quiz, setQuiz] = useState(null);
  const [order, setOrder] = useState([]); // shuffled display order (indexes into quiz.questions)
  const [qIndex, setQIndex] = useState(0);
  const [answersById, setAnswersById] = useState({}); // questionId -> selectedOption
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const answersRef = useRef({});

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quizzes/${quizId}`);
        const q = response.data;
        // Shuffle per attempt (Fisher-Yates); answers key by questionId so grading stays correct.
        const shuffled = q.questions.map((_, i) => i);
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setQuiz(q);
        setOrder(shuffled);
        if (q.timeLimitMinutes) setSecondsLeft(q.timeLimitMinutes * 60);
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const submitRef = useRef();
  const doSubmit = async () => {
    if (submitted) return;
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOption: answersRef.current[q._id] ?? null,
      }));
      const response = await api.post('/quiz/submit', { userId: user.id, quizId, answers: payload });
      setResult(response.data);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };
  submitRef.current = doSubmit;

  // Countdown for timed quizzes — auto-submits at zero.
  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (secondsLeft <= 0) { submitRef.current(); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submitted]);

  const currentQuestion = quiz && order.length ? quiz.questions[order[qIndex]] : null;
  const selectedOption = currentQuestion ? (answersById[currentQuestion._id] ?? null) : null;

  const handleSelectOption = (optionIndex) => {
    const next = { ...answersById, [currentQuestion._id]: optionIndex };
    setAnswersById(next);
    answersRef.current = next;
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= order.length) return;
    setQIndex(idx);
  };

  if (loading) return <div className="container"><div className="loading-state"><div className="spinner" /><span>Loading quiz…</span></div></div>;
  if (!quiz || !currentQuestion) return <div className="container">Quiz not found</div>;

  /* ---------- results screen ---------- */
  if (submitted && result) {
    if (showReview) {
      return (
        <div className="container">
          <div className="pp-hero">
            <p className="pp-eyebrow">Answer review</p>
            <h1 className="pp-title">{quiz.title}</h1>
            <p className="pp-sub">You scored {result.score}% · {result.correctAnswers}/{result.totalQuestions} correct</p>
          </div>
          <div className="qt-review-list">
            {result.answers.map((a, i) => (
              <div key={a.questionId} className={`pp-panel qt-review-item ${a.isCorrect ? 'qt-correct' : 'qt-wrong'}`}>
                <div className="qt-review-head">
                  <span className="pp-tag">{i + 1}</span>
                  <span className={`pp-tag ${a.isCorrect ? 'pp-tag-mint' : 'pp-tag-coral'}`}>
                    {a.isCorrect ? 'Correct' : 'Wrong'}
                  </span>
                  {a.topic && <span className="pp-count">{a.topic}</span>}
                </div>
                <h3 className="qt-question">{a.questionText}</h3>
                <div className="qt-options">
                  {a.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`qt-option${oi === a.correctOptionIndex ? ' qt-opt-correct' : ''}${oi === a.selectedOption && !a.isCorrect ? ' qt-opt-wrong-pick' : ''}`}
                    >
                      <div className="qt-option-radio">
                        {(oi === a.correctOptionIndex || oi === a.selectedOption) && <div className="qt-radio-dot" />}
                      </div>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
                {a.selectedOption === -1 || a.selectedOption === null ? (
                  <p className="qt-skipped">You skipped this question.</p>
                ) : null}
                {a.explanation && (
                  <div className="qt-explanation">
                    <strong>Why:</strong> {a.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="qt-actions">
            <button onClick={() => setShowReview(false)} className="btn btn-secondary">Back to results</button>
            <button onClick={() => navigate('/quizzes')} className="btn btn-primary">More quizzes</button>
          </div>
        </div>
      );
    }

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
            <button onClick={() => setShowReview(true)} className="btn btn-primary">Review answers</button>
            <button onClick={() => navigate('/quizzes')} className="btn btn-secondary">Back to Quizzes</button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- question screen ---------- */
  const progress = ((qIndex + 1) / order.length) * 100;
  const answeredCount = Object.keys(answersById).length;

  return (
    <div className="container">
      <div className="pp-panel">
        <div className="pp-progress-head">
          <span>Question {qIndex + 1} of {order.length}</span>
          <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {secondsLeft !== null && (
              <span className={`qt-timer ${secondsLeft < 60 ? 'qt-timer-urgent' : ''}`} role="timer" aria-label="Time remaining">
                ⏱ {formatCountdown(secondsLeft)}
              </span>
            )}
            <span>{Math.round(progress)}%</span>
          </span>
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
          <button onClick={() => goTo(qIndex - 1)} className="btn btn-secondary" disabled={qIndex === 0}>
            Previous
          </button>
          <span className="pp-count">{answeredCount}/{order.length} answered</span>
          <button
            onClick={() => (qIndex === order.length - 1 ? doSubmit() : goTo(qIndex + 1))}
            className="btn btn-primary"
          >
            {qIndex === order.length - 1 ? `Submit (${answeredCount}/${order.length})` : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizTake;
