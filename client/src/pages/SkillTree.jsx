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
        <h1>Skill Tree</h1>
        <div className="empty-state">
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
    <div className="container skill-tree-page">
      <div className="skill-tree-header">
        <div>
          <h1>Skill Tree: {subject?.name || 'Loading...'}</h1>
          <p className="subtitle">Master skills progressively by completing prerequisites</p>
        </div>
        <div className="skill-stats">
          <div className="stat-item">
            <span className="stat-value">{completeCount}</span>
            <span className="stat-label">Complete</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{currentCount}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{lockedCount}</span>
            <span className="stat-label">Locked</span>
          </div>
        </div>
      </div>

      <div className="legend">
        <h3>Legend:</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="skill-node node-complete"></div>
            <span>Complete</span>
          </div>
          <div className="legend-item">
            <div className="skill-node node-current"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="skill-node node-locked"></div>
            <span>Locked</span>
          </div>
        </div>
      </div>

      <div className="skill-tree-container">
        {layers.map(layer => (
          <div key={layer} className="skill-layer">
            <div className="layer-label">Layer {layer}</div>
            <div className="layer-nodes">
              {nodesByLayer[layer].map(node => (
                <div
                  key={node._id}
                  className={`skill-node-wrapper ${node.state}`}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className={`skill-node node-${node.state}`}>
                    <div className="node-content">
                      <div className="node-title">{node.title}</div>
                      {node.prerequisiteSkillNodeIds && node.prerequisiteSkillNodeIds.length > 0 && (
                        <div className="node-prereq-count">
                          {node.prerequisiteSkillNodeIds.length} prereq{node.prerequisiteSkillNodeIds.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    {node.state === 'complete' && <div className="node-check">✓</div>}
                    {node.state === 'locked' && <div className="node-lock">🔒</div>}
                  </div>
                  {/* Draw connections to prerequisites */}
                  {node.prerequisiteSkillNodeIds && node.prerequisiteSkillNodeIds.length > 0 && (
                    <div className="node-connections">
                      {node.prerequisiteSkillNodeIds.map((prereqId, index) => (
                        <div key={index} className="connection-line"></div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Node Detail Modal */}
      {selectedNode && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <div className={`modal-header status-${selectedNode.state}`}>
              <h2>{selectedNode.title}</h2>
              <span className={`status-badge badge-${selectedNode.state}`}>
                {selectedNode.state === 'complete' && '✓ Complete'}
                {selectedNode.state === 'current' && '🔓 Available'}
                {selectedNode.state === 'locked' && '🔒 Locked'}
              </span>
            </div>

            {selectedNode.description && (
              <div className="modal-section">
                <p>{selectedNode.description}</p>
              </div>
            )}

            {selectedNode.prerequisiteSkillNodeIds && selectedNode.prerequisiteSkillNodeIds.length > 0 && (
              <div className="modal-section">
                <h3>Prerequisites</h3>
                <ul className="prereq-list">
                  {selectedNode.prerequisiteSkillNodeIds.map((prereq, index) => (
                    <li key={index}>{prereq.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedNode.contentType !== 'none' && (
              <div className="modal-section">
                <h3>Linked Content</h3>
                {selectedNode.contentType === 'chapter' && selectedNode.chapter && selectedNode.book && (
                  <div className="linked-content">
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
              <div className="modal-section locked-message">
                <p>🔒 Complete the prerequisites to unlock this skill.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillTree;
