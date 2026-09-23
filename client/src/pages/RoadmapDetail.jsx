import { useState, useEffect } from 'react';
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
      {/* Hero header */}
      <div className="detail-page-header">
        <Link to="/roadmaps" className="btn btn-secondary btn-sm" style={{ marginBottom: 'var(--space-5)', display: 'inline-flex' }}>
          ← Roadmaps
        </Link>
        <h1>{roadmap.title}</h1>
        {roadmap.description && <p>{roadmap.description}</p>}
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-value">{nodes.length}</span>
            <span className="detail-stat-label">Milestones</span>
          </div>
          {roadmap.category && (
            <div className="detail-stat">
              <span className="detail-stat-value">{roadmap.category}</span>
              <span className="detail-stat-label">Category</span>
            </div>
          )}
          {roadmap.estimatedDuration && (
            <div className="detail-stat">
              <span className="detail-stat-value">{roadmap.estimatedDuration}</span>
              <span className="detail-stat-label">Estimated time</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="section-title">Milestones</h2>

      {nodes.length === 0 ? (
        <div className="empty-state"><p>No milestones yet.</p></div>
      ) : isMobile ? (
        <div className="roadmap-tree animate-rise">
          {nodes.map((node, index) => {
            const sideClass = index % 2 === 0 ? 'left' : 'right';
            return (
              <div key={node._id} className={`roadmap-node-container ${sideClass}`}>
                <div className="roadmap-node-content scholar-shell press">
                  <h3>
                    <span style={{ color: 'var(--color-ink-500)', marginRight: '8px' }}>
                      {node.order || index + 1}.
                    </span>
                    {node.title}
                  </h3>
                  {node.description && <p>{node.description}</p>}
                  
                  <div className="node-meta">
                    {node.phase && (
                      <span className="badge badge-ember">{node.phase}</span>
                    )}
                    {node.milestone && (
                      <span className="badge badge-verdigris">🏆 {node.milestone}</span>
                    )}
                  </div>

                  {node.learningPath && (
                    <div className="node-actions">
                      <Link to={`/learning-path/${node.learningPath._id}`}>
                        <button className="btn btn-secondary btn-sm">
                          📚 {node.learningPath.title}
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative mt-8">
          <RoadmapGraph rawNodes={nodes} onNodeClick={setSelectedNode} />
        </div>
      )}

      {selectedNode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
          <div 
            className="w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{selectedNode.title}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            {selectedNode.phase && (
              <span className="badge badge-ember mb-4">{selectedNode.phase}</span>
            )}
            
            <p className="text-gray-700 text-base leading-relaxed mb-6">
              {selectedNode.description || 'No description available for this milestone.'}
            </p>

            {selectedNode.learningPath && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Resources</h4>
                <Link to={`/learning-path/${selectedNode.learningPath._id}`} className="block w-full">
                  <button className="w-full btn btn-secondary flex items-center justify-center gap-2">
                    <span>📚</span> View {selectedNode.learningPath.title}
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
