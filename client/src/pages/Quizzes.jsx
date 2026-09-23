import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Quizzes.css';

function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await api.get('/quizzes');
        setQuizzes(response.data);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
      </div>
    );
  }

  return (
    <div className="container list-page">
      <h1>Quizzes</h1>
      <p className="page-subtitle">Test your knowledge and earn XP.</p>

      {quizzes.length === 0 ? (
        <div className="empty-state"><p>No quizzes available yet.</p></div>
      ) : (
        <div className="grid grid-2">
          {quizzes.map(quiz => (
            <Link key={quiz._id} to={`/quiz/${quiz._id}`} className="quiz-card">
              <div>
                <h3>{quiz.title}</h3>
                <div className="card-meta" style={{ marginTop: 'var(--space-2)' }}>
                  {quiz.topic && <span className="badge badge-ink">{quiz.topic}</span>}
                  {quiz.difficulty && <span className="badge badge-ember">{quiz.difficulty}</span>}
                  {quiz.questionCount && (
                    <span className="badge badge-ink">{quiz.questionCount} questions</span>
                  )}
                </div>
              </div>
              {quiz.description && <p className="quiz-description">{quiz.description}</p>}
              <div className="quiz-xp">
                <span>💎 +30 XP</span>
                <span className="bonus-xp">+50 XP bonus for 100%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Quizzes;
