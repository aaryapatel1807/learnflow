import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './SkillTree.css';

function SkillTree() {
  const { subjectId } = useParams();
  const [skillTree, setSkillTree] = useState({ nodes: [] });
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const user = getUser();

  useEffect(() => {
    const fetchSkillTree = async () => {
      try {
        const [treeResponse, subjectsResponse] = await Promise.all([
          api.get(`/skill-tree/${subjectId}?userId=${user.id}`),
          api.get('/subjects')
        ]);

        setSkillTree(treeResponse.data);
        
        const currentSubject = subjectsResponse.data.find(s => s._id === subjectId);
        setSubject(currentSubject);
      } catch (error) {
        console.error('Error fetching skill tree:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillTree();
  }, [subjectId, user.id]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const closeModal = () => {
    setSelectedNode(null);
  };

  if (loading) {
    return <div className="container">Loading skill tree...</div>;
  }

  if (!skillTree.nodes || skillTree.nodes.length === 0) {
    return (
      <div className="container">
        <div className="pp-hero">
          <p className="pp-eyebrow">Skill tree</p>
          <h1 className="pp-title">Skill Tree</h1>
        </div>
        <div className="pp-empty">
          <p>No skill tree available for this subject yet.</p>
          <Link to="/catalogue">
            <button className="btn btn-primary">Browse Catalogue</button>
          </Link>
        </div>
      </div>
    );
  }

  // Group nodes by layer for layout
  const nodesByLayer = skillTree.nodes.reduce((acc, node) => {
    const layer = node.layer || 0;
    if (!acc[layer]) {
      acc[layer] = [];
    }
    acc[layer].push(node);
    return acc;
  }, {});

  const layers = Object.keys(nodesByLayer).sort((a, b) => Number(a) - Number(b));

  // Stats
  const completeCount = skillTree.nodes.filter(n => n.state === 'complete').length;
  const currentCount = skillTree.nodes.filter(n => n.state === 'current').length;
  const lockedCount = skillTree.nodes.filter(n => n.state === 'locked').length;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Skill tree</p>
        <h1 className="pp-title">{subject?.name || 'Loading...'}</h1>
        <p className="pp-sub">Master skills progressively by completing prerequisites.</p>
      </div>

      <div className="pp-cards">
        <div className="pp-card pp-mint">
          <span className="pp-card-label">Complete</span>
          <span className="pp-card-value">{completeCount}</span>
        </div>
        <div className="pp-card pp-coral">
          <span className="pp-card-label">Available</span>
          <span className="pp-card-value">{currentCount}</span>
        </div>
        <div className="pp-card pp-violet">
          <span className="pp-card-label">Locked</span>
          <span className="pp-card-value">{lockedCount}</span>
        </div>
      </div>

      <div className="pp-panel st-legend">
        <span className="pp-eyebrow" style={{ margin: 0 }}>Legend</span>
        <div className="st-legend-items">
          <span className="st-legend-item"><span className="st-dot st-complete"></span>Complete</span>
          <span className="st-legend-item"><span className="st-dot st-current"></span>Available</span>
          <span className="st-legend-item"><span className="st-dot st-locked"></span>Locked</span>
        </div>
      </div>

      <div className="pp-panel st-tree">
        {layers.map(layer => (
          <div key={layer} className="st-layer">
            <div className="st-layer-label">Layer {layer}</div>
            <div className="st-layer-nodes">
              {nodesByLayer[layer].map(node => (
                <div
                  key={node._id}
                  className={`st-node st-${node.state}`}
                  onClick={() => handleNodeClick(node)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleNodeClick(node)}
                >
                  <div className="st-node-title">{node.title}</div>
                  {node.prerequisiteSkillNodeIds && node.prerequisiteSkillNodeIds.length > 0 && (
                    <div className="st-node-prereq">
                      {node.prerequisiteSkillNodeIds.length} prereq{node.prerequisiteSkillNodeIds.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {node.state === 'complete' && <div className="st-node-badge">✓</div>}
                  {node.state === 'locked' && <div className="st-node-badge">🔒</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Node Detail Modal */}
      {selectedNode && (
        <div className="st-overlay" onClick={closeModal}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <button className="st-modal-close" onClick={closeModal} aria-label="Close">×</button>

            <div className="st-modal-head">
              <h2>{selectedNode.title}</h2>
              <span className={`pp-tag ${
                selectedNode.state === 'complete' ? 'pp-tag-mint' :
                selectedNode.state === 'current' ? 'pp-tag-coral' : 'pp-tag-grey'
              }`}>
                {selectedNode.state === 'complete' && '✓ Complete'}
                {selectedNode.state === 'current' && '🔓 Available'}
                {selectedNode.state === 'locked' && '🔒 Locked'}
              </span>
            </div>

            {selectedNode.description && <p className="st-modal-desc">{selectedNode.description}</p>}

            {selectedNode.prerequisiteSkillNodeIds && selectedNode.prerequisiteSkillNodeIds.length > 0 && (
              <div className="st-modal-section">
                <h3>Prerequisites</h3>
                <ul className="st-prereq-list">
                  {selectedNode.prerequisiteSkillNodeIds.map((prereq, index) => (
                    <li key={index}>{prereq.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedNode.contentType !== 'none' && (
              <div className="st-modal-section">
                <h3>Linked Content</h3>
                {selectedNode.contentType === 'chapter' && selectedNode.chapter && selectedNode.book && (
                  <div className="st-linked">
                    <p><strong>Book:</strong> {selectedNode.book.title}</p>
                    <p><strong>Chapter:</strong> {selectedNode.chapter.chapterNumber}. {selectedNode.chapter.title}</p>
                    <Link to={`/book/${selectedNode.book._id}`}>
                      <button className="btn btn-primary">Go to Content</button>
                    </Link>
                  </div>
                )}
                {selectedNode.contentType === 'topic' && (
                  <p><strong>Topic:</strong> {selectedNode.topic}</p>
                )}
              </div>
            )}

            {selectedNode.state === 'locked' && (
              <p className="st-locked-msg">🔒 Complete the prerequisites to unlock this skill.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillTree;
