import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { RoadmapNode } from './RoadmapNode';
import { RoadmapEdges } from './RoadmapEdges';
import { NodeDrawer } from './NodeDrawer';
import { RoadmapNodeData } from '../../types';

export const RoadmapCanvas: React.FC = () => {
  const nodes = useAppStore(state => state.nodes);
  const edges = useAppStore(state => state.edges);
  const selectedNodeId = useAppStore(state => state.selectedNodeId);
  const setSelectedNodeId = useAppStore(state => state.setSelectedNodeId);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // For panning
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth spring for camera centering
  const springX = useSpring(x, { stiffness: 100, damping: 20 });
  const springY = useSpring(y, { stiffness: 100, damping: 20 });

  const handleNodeClick = (node: RoadmapNodeData) => {
    setSelectedNodeId(node.id);
    // Center camera on node
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      // Calculate offset to center the node
      const targetX = (clientWidth / 2) - node.position.x;
      const targetY = (clientHeight / 2) - node.position.y;
      
      x.set(targetX);
      y.set(targetY);
    }
  };

  // Center initial view if nodes exist
  useEffect(() => {
    if (nodes.length > 0 && containerRef.current && x.get() === 0 && y.get() === 0) {
      const firstNode = nodes[0];
      const { clientWidth, clientHeight } = containerRef.current;
      x.set((clientWidth / 2) - firstNode.position.x);
      y.set((clientHeight / 2) - firstNode.position.y);
    }
  }, [nodes]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gray-950 overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <motion.div
        drag
        dragConstraints={containerRef} // Ideally calculate actual bounds based on nodes
        dragElastic={0.2}
        style={{ x: springX, y: springY }}
        className="absolute inset-0 w-[4000px] h-[4000px]"
        // Provide enough space for panning
      >
        <RoadmapEdges edges={edges} nodes={nodes} />
        
        {nodes.map(node => (
          <RoadmapNode 
            key={node.id} 
            node={node} 
            onClick={handleNodeClick}
            isSelected={selectedNodeId === node.id}
          />
        ))}
      </motion.div>

      <NodeDrawer 
        nodeId={selectedNodeId} 
        onClose={() => setSelectedNodeId(null)} 
      />
    </div>
  );
};
