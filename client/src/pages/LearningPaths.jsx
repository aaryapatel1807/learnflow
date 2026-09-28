import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

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
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Journeys</p>
        <h1 className="pp-title">Learning Paths</h1>
        <p className="pp-sub">Structured journeys to master new skills, step by step.</p>
      </div>

      {learningPaths.length === 0 ? (
        <div className="pp-empty">
          <p>No learning paths available yet.</p>
        </div>
      ) : (
        <div className="pp-grid">
          {learningPaths.map(path => (
            <div key={path._id} className="pp-card-item">
              <h3>{path.title}</h3>
              <div className="pp-tags">
                {path.subject && <span className="pp-tag pp-tag-blue">{path.subject.name}</span>}
                {path.difficulty && <span className="pp-tag pp-tag-coral">{path.difficulty}</span>}
                {path.nodeCount && <span className="pp-tag pp-tag-grey">{path.nodeCount} steps</span>}
                {path.estimatedDuration && (
                  <span className="pp-tag pp-tag-grey">{path.estimatedDuration}</span>
                )}
              </div>
              <p>{path.description}</p>
              <div className="pp-card-actions">
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
