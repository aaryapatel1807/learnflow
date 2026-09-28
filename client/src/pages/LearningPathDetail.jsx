import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './LearningPathDetail.css';

const toVarName = (title) =>
  title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join('') || 'learningPath';

const toSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'learning-path';

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
  const title = clean(learningPath.title);
  const currentIndex = nodes.findIndex(n => !n.isComplete && !n.isLocked);

  const stateOf = (node, index) => {
    if (node.isComplete) return 'is-complete';
    if (node.isLocked) return 'is-locked';
    if (index === currentIndex) return 'is-current';
    return 'is-todo';
  };

  return (
    <div className="container">
      <Link to="/learning-paths" className="btn btn-secondary btn-sm code-back">
        ← Learning paths
      </Link>

      <div className="code-window">
        {/* Editor chrome */}
        <div className="code-titlebar">
          <div className="code-dots" aria-hidden="true"><span /><span /><span /></div>
          <div className="code-tab">{toSlug(title)}.js</div>
        </div>

        <div className="code-body">
          {/* Hero rendered as syntax-highlighted code */}
          <pre className="code-hero"><code>
            <span className="tok-kw">const</span> <span className="tok-var">{toVarName(title)}</span>{' '}
            <span className="tok-punc">=</span> <span className="tok-punc">{'{'}</span>{'\n'}
            {'  '}<span className="tok-prop">title</span><span className="tok-punc">:</span>{' '}
            <span className="tok-str">'{title}'</span><span className="tok-punc">,</span>{'\n'}
            <span className="tok-punc">{'}'}</span>
            {learningPath.description && (
              <>{'\n'}<span className="tok-comment">{'// '}{clean(learningPath.description)}</span></>
            )}
          </code></pre>

          {/* Stat chips */}
          <div className="code-chips">
            <span className="code-chip chip-cyan">[ {completeCount}/{totalCount} steps ]</span>
            {learningPath.difficulty && (
              <span className="code-chip chip-amber">[ {String(learningPath.difficulty).toLowerCase()} ]</span>
            )}
            {learningPath.estimatedDuration && (
              <span className="code-chip chip-purple">[ {clean(learningPath.estimatedDuration)} ]</span>
            )}
          </div>

          {/* Progress */}
          <div className="code-progress-label">Progress — {pct}%</div>
          <div className="code-progress">
            <div className="code-progress-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="code-section-comment">
            <span className="tok-comment">{'// ── path steps ──'}</span>
          </div>

          {/* Steps as 3D code blocks */}
          <div className="code-steps">
            {nodes.map((node, index) => {
              const state = stateOf(node, index);
              const locked = state === 'is-locked';
              const done = state === 'is-complete';
              return (
                <div
                  key={node._id}
                  className={`code-step ${state}`}
                  onClick={() => handleNodeClick(node)}
                  style={{ cursor: locked ? 'default' : 'pointer' }}
                  role={locked ? undefined : 'button'}
                  tabIndex={locked ? undefined : 0}
                  onKeyDown={(e) => e.key === 'Enter' && handleNodeClick(node)}
                >
                  <span className="code-gutter" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="code-step-main">
                    <div className="code-step-title-row">
                      <h3>{clean(node.title)}</h3>
                      {done && <span className="code-status done" title="Completed">✓</span>}
                      {locked && <span className="code-status locked" title="Locked">🔒</span>}
                    </div>
                    {node.description && <p>{clean(node.description)}</p>}
                    {node.book && (
                      <span className="code-book">📖 {clean(node.book.title)}</span>
                    )}
                  </div>
                  <div className="code-step-action">
                    {done && <span className="code-pill pill-done">Completed</span>}
                    {locked && <span className="code-pill pill-locked">Locked</span>}
                    {!done && !locked && node.book && (
                      <button className="code-btn" onClick={(e) => openBook(e, node)}>
                        {state === 'is-current' ? 'Continue →' : 'Open →'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningPathDetail;
