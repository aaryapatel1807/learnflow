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
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Challenge</p>
        <h1 className="pp-title">Quizzes</h1>
        <p className="pp-sub">Test your knowledge and earn XP.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="pp-empty"><p>No quizzes available yet.</p></div>
      ) : (
        <div className="pp-grid pp-grid-2">
          {quizzes.map(quiz => (
            <Link key={quiz._id} to={`/quiz/${quiz._id}`} className="pp-card-item">
              <h3>{quiz.title}</h3>
              <div className="pp-tags">
                {quiz.topic && <span className="pp-tag pp-tag-blue">{quiz.topic}</span>}
                {quiz.difficulty && <span className="pp-tag pp-tag-coral">{quiz.difficulty}</span>}
                {quiz.questionCount && (
                  <span className="pp-tag pp-tag-grey">{quiz.questionCount} questions</span>
                )}
              </div>
              {quiz.description && <p>{quiz.description}</p>}
              <div className="pp-card-actions" style={{ justifyContent: 'space-between' }}>
                <span className="pp-tag pp-tag-mint">💎 +30 XP</span>
                <span className="pp-count">+50 XP bonus for 100%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Quizzes;
