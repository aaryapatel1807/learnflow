import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './LearningPaths.css';

function LearningPaths() {
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        const response = await api.get('/learning-paths');
        setLearningPaths(response.data);
      } catch (error) {
        console.error('Error fetching learning paths:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLearningPaths();
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
      <h1>Learning Paths</h1>
      <p className="page-subtitle">Structured journeys to master new skills, step by step.</p>

      {learningPaths.length === 0 ? (
        <div className="empty-state">
          <p>No learning paths available yet.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {learningPaths.map(path => (
            <div key={path._id} className="path-card">
              <h3>{path.title}</h3>
              <div className="card-meta">
                {path.subject && <span className="badge badge-ink">{path.subject.name}</span>}
                <span className="badge badge-ember">{path.difficulty}</span>
                {path.nodeCount && <span className="badge badge-ink">{path.nodeCount} steps</span>}
                {path.estimatedDuration && (
                  <span className="badge badge-ink">{path.estimatedDuration}</span>
                )}
              </div>
              <p>{path.description}</p>
              <div className="card-actions">
                <Link to={`/learning-path/${path._id}`}>
                  <button className="btn btn-primary btn-sm">View path</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LearningPaths;
