import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './LearningPathDetail.css';

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

function LearningPathDetail() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const [learningPath, setLearningPath] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        const response = await api.get(`/learning-paths/${pathId}?userId=${user.id}`);
        setLearningPath(response.data);
        setNodes(response.data.nodes || []);
      } catch (error) {
        console.error('Error fetching learning path:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLearningPath();
  }, [pathId, user.id]);

  const handleNodeClick = (node) => {
    if (node.isLocked) {
      alert('Complete the prerequisites first to unlock this step.');
      return;
    }
    if (node.book) navigate(`/book/${node.book._id}`);
  };

  const openBook = (e, node) => {
    e.stopPropagation();
    if (node.book) navigate(`/book/${node.book._id}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading path…</span></div>
      </div>
    );
  }

  if (!learningPath) {
    return <div className="container"><p>Learning path not found.</p></div>;
  }

  const completeCount = nodes.filter(n => n.isComplete).length;
  const totalCount = nodes.length;
  const pct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;
  const currentIndex = nodes.findIndex(n => !n.isComplete && !n.isLocked);

  const getIcon = (node) => {
    if (node.isComplete) return '✓';
    if (node.isLocked) return '🔒';
    return null; // order number rendered by caller
  };

  const getStateClass = (node, index) => {
    if (node.isComplete) return 'is-complete';
    if (node.isLocked) return 'is-locked';
    if (index === currentIndex) return 'is-current';
    return 'is-todo';
  };

  return (
    <div className="container">
      <Link to="/learning-paths" className="btn btn-secondary btn-sm lp-back">
        ← Learning paths
      </Link>

      {/* Hero */}
      <div className="lp-hero">
        <p className="lp-eyebrow">Learning path</p>
        <h1 className="lp-title">{clean(learningPath.title)}</h1>
        {learningPath.description && <p className="lp-sub">{clean(learningPath.description)}</p>}
      </div>

      {/* Stat cards */}
      <div className="lp-cards">
        <div className="lp-card lp-coral">
          <span className="lp-card-label">Steps complete</span>
          <span className="lp-card-value">{completeCount}<small>/{totalCount}</small></span>
        </div>
        {learningPath.difficulty && (
          <div className="lp-card lp-violet">
            <span className="lp-card-label">Difficulty</span>
            <span className="lp-card-value lp-card-text">{clean(learningPath.difficulty)}</span>
          </div>
        )}
        {learningPath.estimatedDuration && (
          <div className="lp-card lp-blue">
            <span className="lp-card-label">Estimated time</span>
            <span className="lp-card-value lp-card-text">{clean(learningPath.estimatedDuration)}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="lp-progress-wrap">
        <div className="lp-progress-head">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="lp-progress">
          <div className="lp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Steps */}
      <h2 className="lp-section">Path Steps</h2>
      <div className="lp-steps">
        {nodes.map((node, index) => {
          const state = getStateClass(node, index);
          const locked = state === 'is-locked';
          const done = state === 'is-complete';
          return (
            <div key={node._id}>
              <div
                className={`lp-step ${state}`}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: locked ? 'default' : 'pointer' }}
                role={locked ? undefined : 'button'}
                tabIndex={locked ? undefined : 0}
                onKeyDown={(e) => e.key === 'Enter' && handleNodeClick(node)}
              >
                <div className={`lp-step-icon ${state}`}>
                  {getIcon(node) || (node.order || index + 1)}
                </div>
                <div className="lp-step-main">
                  <h3>{clean(node.title)}</h3>
                  {node.description && <p>{clean(node.description)}</p>}
                  {node.book && (
                    <span className="lp-book">📖 {clean(node.book.title)}</span>
                  )}
                </div>
                <div className="lp-step-action">
                  {done && <span className="lp-pill lp-pill-done">✓ Completed</span>}
                  {locked && <span className="lp-pill lp-pill-locked">🔒 Locked</span>}
                  {!done && !locked && node.book && (
                    <button className="btn btn-primary btn-sm" onClick={(e) => openBook(e, node)}>
                      Open
                    </button>
                  )}
                </div>
              </div>
              {index < nodes.length - 1 && <div className="lp-connector" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LearningPathDetail;
