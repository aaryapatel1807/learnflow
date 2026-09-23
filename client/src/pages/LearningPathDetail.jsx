import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './LearningPathDetail.css';

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

  const getIcon = (node) => {
    if (node.isComplete) return '✓';
    if (node.isLocked) return '🔒';
    return String(node.order || '·');
  };

  const getStateClass = (node) => {
    if (node.isComplete) return 'complete';
    if (node.isLocked) return 'locked';
    return 'current';
  };

  return (
    <div className="container">
      {/* Hero header */}
      <div className="detail-page-header">
        <Link to="/learning-paths" className="btn btn-secondary btn-sm" style={{ marginBottom: 'var(--space-5)', display: 'inline-flex' }}>
          ← Learning paths
        </Link>
        <h1>{learningPath.title}</h1>
        {learningPath.description && <p>{learningPath.description}</p>}
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-value">{completeCount}/{totalCount}</span>
            <span className="detail-stat-label">Steps complete</span>
          </div>
          {learningPath.difficulty && (
            <div className="detail-stat">
              <span className="detail-stat-value">{learningPath.difficulty}</span>
              <span className="detail-stat-label">Difficulty</span>
            </div>
          )}
          {learningPath.estimatedDuration && (
            <div className="detail-stat">
              <span className="detail-stat-value">{learningPath.estimatedDuration}</span>
              <span className="detail-stat-label">Estimated time</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="progress-fill" style={{ width: totalCount > 0 ? `${(completeCount/totalCount)*100}%` : '0%' }} />
      </div>

      {/* Nodes */}
      <h2 className="section-title">Path Steps</h2>
      <div className="nodes-list">
        {nodes.map((node, index) => (
          <div key={node._id}>
            <div
              className={`node-item ${node.isLocked ? 'locked' : ''}`}
              onClick={() => handleNodeClick(node)}
              style={{ cursor: node.isLocked ? 'default' : 'pointer' }}
              role={node.isLocked ? undefined : 'button'}
              tabIndex={node.isLocked ? undefined : 0}
              onKeyDown={(e) => e.key === 'Enter' && handleNodeClick(node)}
            >
              <div className={`node-state-icon ${getStateClass(node)}`}>
                {getIcon(node)}
              </div>
              <div className="node-info">
                <h3>{node.title}</h3>
                {node.description && <p>{node.description}</p>}
                {node.book && (
                  <p style={{ marginTop: 'var(--space-1)' }}>
                    <span className="badge badge-ink" style={{ fontSize: 'var(--text-xs)' }}>
                      📖 {node.book.title}
                    </span>
                  </p>
                )}
              </div>
              {!node.isLocked && node.isComplete && (
                <span className="badge badge-verdigris">Complete</span>
              )}
              {!node.isLocked && !node.isComplete && node.book && (
                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/book/${node.book._id}`); }}>
                  Open
                </button>
              )}
            </div>
            {index < nodes.length - 1 && (
              <div style={{ width: 2, height: 20, background: 'var(--color-parchment-200)', margin: '0 auto' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningPathDetail;
