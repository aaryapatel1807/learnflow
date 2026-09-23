import React, { useEffect } from 'react';
import { RoadmapCanvas } from '../components/roadmap/RoadmapCanvas';
import { useAppStore } from '../store/useAppStore';
import { mockRoadmapData, mockEdges } from '../lib/mockData';
import { Link } from 'react-router-dom';

export const RoadmapView: React.FC = () => {
  const setNodes = useAppStore(state => state.setNodes);
  const setEdges = useAppStore(state => state.setEdges);
  const nodes = useAppStore(state => state.nodes);

  // Load mock data on mount if store is empty (or we want to reset it)
  useEffect(() => {
    if (nodes.length === 0) {
      setNodes(mockRoadmapData);
      setEdges(mockEdges);
    }
  }, [nodes.length, setNodes, setEdges]);

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col">
      <div className="absolute top-0 left-0 w-full z-10 p-6 flex justify-between items-center pointer-events-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight pointer-events-auto">Developer Roadmap</h1>
          <p className="text-gray-400 text-sm pointer-events-auto">Interactive learning path for modern frontend architecture.</p>
        </div>
        <div className="flex gap-4 pointer-events-auto">
           <Link to="/portfolio" className="btn btn-secondary border border-white/20 bg-black/40 text-white hover:bg-white/10 rounded-lg px-4 py-2">
             View 3D Portfolio
           </Link>
           <Link to="/" className="btn btn-secondary border border-white/20 bg-black/40 text-white hover:bg-white/10 rounded-lg px-4 py-2">
             Back to Home
           </Link>
        </div>
      </div>
      
      <div className="flex-1">
        <RoadmapCanvas />
      </div>
    </div>
  );
};
