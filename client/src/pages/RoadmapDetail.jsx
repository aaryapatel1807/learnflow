import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import RoadmapGraph from '../components/roadmap-graph/RoadmapGraph';
import './RoadmapDetail.css';

function RoadmapDetail() {
  const { roadmapId } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Hover-toolbar status updates: optimistic UI, revert on failure.
  const handleStatusChange = useCallback(async (nodeId, status) => {
    const prev = nodes;
    setNodes((ns) => ns.map((n) => (n._id === nodeId ? { ...n, status } : n)));
    try {
      await api.patch(`/roadmaps/nodes/${nodeId}/status`, { status });
    } catch (error) {
      console.error('Status update failed:', error);
      setNodes(prev);
    }
  }, [nodes]);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await api.get(`/roadmaps/${roadmapId}`);
        setRoadmap(response.data);
        setNodes(response.data.nodes || []);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [roadmapId]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
      </div>
    );
  }

  if (!roadmap) return <div className="container"><p>Roadmap not found.</p></div>;

  return (
    <div className="container">
      <Link to="/roadmaps" className="btn btn-secondary btn-sm pp-back">
        ← Roadmaps
      </Link>

      <div className="pp-hero">
        <p className="pp-eyebrow">Roadmap</p>
        <h1 className="pp-title">{roadmap.title}</h1>
        {roadmap.description && <p className="pp-sub">{roadmap.description}</p>}
      </div>

      <div className="pp-cards">
        <div className="pp-card pp-coral">
          <span className="pp-card-label">Milestones</span>
          <span className="pp-card-value">{nodes.length}</span>
        </div>
        {roadmap.category && (
          <div className="pp-card pp-violet">
            <span className="pp-card-label">Category</span>
            <span className="pp-card-value pp-card-text">{roadmap.category}</span>
          </div>
        )}
        {roadmap.estimatedDuration && (
          <div className="pp-card pp-blue">
            <span className="pp-card-label">Estimated time</span>
            <span className="pp-card-value pp-card-text">{roadmap.estimatedDuration}</span>
          </div>
        )}
      </div>

      <h2 className="pp-section-title">Milestones</h2>

      {nodes.length === 0 ? (
        <div className="pp-empty"><p>No milestones yet.</p></div>
      ) : isMobile ? (
        <div className="pp-rows">
          {nodes.map((node, index) => (
            <div key={node._id} className="pp-row">
              <div className="pp-row-main">
                <h3>{node.order || index + 1}. {node.title}</h3>
                {node.description && <p>{node.description}</p>}
                <div className="pp-tags" style={{ marginTop: '8px' }}>
                  {node.phase && <span className="pp-tag pp-tag-coral">{node.phase}</span>}
                  {node.milestone && <span className="pp-tag pp-tag-mint">🏆 {node.milestone}</span>}
                </div>
                {node.learningPath && (
                  <div style={{ marginTop: '10px' }}>
                    <Link to={`/learning-path/${node.learningPath._id}`}>
                      <button className="btn btn-secondary btn-sm">
                        📚 {node.learningPath.title}
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rd-graph-wrap">
          <RoadmapGraph rawNodes={nodes} onNodeClick={setSelectedNode} onStatusChange={handleStatusChange} />
        </div>
      )}

      {selectedNode && (
        <div className="rd-overlay" onClick={() => setSelectedNode(null)}>
          <div className="rd-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="rd-drawer-head">
              <h3>{selectedNode.title}</h3>
              <button onClick={() => setSelectedNode(null)} className="rd-close" aria-label="Close">✕</button>
            </div>

            {selectedNode.phase && (
              <span className="pp-tag pp-tag-coral">{selectedNode.phase}</span>
            )}

            <p className="rd-drawer-desc">
              {selectedNode.description || 'No description available for this milestone.'}
            </p>

            {selectedNode.learningPath && (
              <div className="rd-drawer-resources">
                <h4>Resources</h4>
                <Link to={`/learning-path/${selectedNode.learningPath._id}`}>
                  <button className="btn btn-secondary" style={{ width: '100%' }}>
                    📚 View {selectedNode.learningPath.title}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoadmapDetail;
