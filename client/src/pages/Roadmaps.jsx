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
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Big picture</p>
        <h1 className="pp-title">Learning Roadmaps</h1>
        <p className="pp-sub">Big-picture journeys from beginner to expert.</p>
      </div>

      {roadmaps.length === 0 ? (
        <div className="pp-empty"><p>No roadmaps available yet.</p></div>
      ) : (
        <div className="pp-grid">
          {roadmaps.map(roadmap => (
            <div key={roadmap._id} className="pp-card-item">
              <h3>{roadmap.title}</h3>
              <div className="pp-tags">
                {roadmap.category && <span className="pp-tag pp-tag-blue">{roadmap.category}</span>}
                {roadmap.nodeCount && (
                  <span className="pp-tag pp-tag-grey">{roadmap.nodeCount} milestones</span>
                )}
                {roadmap.estimatedDuration && (
                  <span className="pp-tag pp-tag-grey">{roadmap.estimatedDuration}</span>
                )}
              </div>
              {roadmap.description && <p>{roadmap.description}</p>}
              {roadmap.targetAudience && (
                <p className="pp-count">For: {roadmap.targetAudience}</p>
              )}
              <div className="pp-card-actions">
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
