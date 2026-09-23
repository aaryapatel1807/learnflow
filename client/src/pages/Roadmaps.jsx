import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Roadmaps.css';

function Roadmaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const response = await api.get('/roadmaps');
        setRoadmaps(response.data);
      } catch (error) {
        console.error('Error fetching roadmaps:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
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
      <h1>Learning Roadmaps</h1>
      <p className="page-subtitle">Big-picture journeys from beginner to expert.</p>

      {roadmaps.length === 0 ? (
        <div className="empty-state"><p>No roadmaps available yet.</p></div>
      ) : (
        <div className="cards-grid">
          {roadmaps.map(roadmap => (
            <div key={roadmap._id} className="roadmap-card">
              <h3>{roadmap.title}</h3>
              <div className="card-meta">
                {roadmap.category && <span className="badge badge-ink">{roadmap.category}</span>}
                {roadmap.nodeCount && (
                  <span className="badge badge-ink">{roadmap.nodeCount} milestones</span>
                )}
                {roadmap.estimatedDuration && (
                  <span className="badge badge-ink">{roadmap.estimatedDuration}</span>
                )}
              </div>
              {roadmap.description && <p>{roadmap.description}</p>}
              {roadmap.targetAudience && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)' }}>
                  For: {roadmap.targetAudience}
                </p>
              )}
              <div className="card-actions">
                <Link to={`/roadmap/${roadmap._id}`}>
                  <button className="btn btn-primary btn-sm">View roadmap</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Roadmaps;
