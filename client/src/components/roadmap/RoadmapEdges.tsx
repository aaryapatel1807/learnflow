import React from 'react';
import { RoadmapEdge, RoadmapNodeData } from '../../types';

interface Props {
  edges: RoadmapEdge[];
  nodes: RoadmapNodeData[];
}

export const RoadmapEdges: React.FC<Props> = ({ edges, nodes }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
      <defs>
        {/* Glow effect for active paths */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Gradient for completed paths */}
        <linearGradient id="completed-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {edges.map((edge) => {
        const fromNode = nodes.find(n => n.id === edge.fromNodeId);
        const toNode = nodes.find(n => n.id === edge.toNodeId);

        if (!fromNode || !toNode) return null;

        // Simple bezier curve from bottom of parent to top of child (assuming top-down flow)
        // Or left-to-right based on coordinate differences.
        const x1 = fromNode.position.x;
        const y1 = fromNode.position.y;
        const x2 = toNode.position.x;
        const y2 = toNode.position.y;

        // Calculate control points for a smooth cubic bezier curve
        // Assuming a generally vertical layout for the roadmap
        const isVertical = Math.abs(y2 - y1) > Math.abs(x2 - x1);
        
        let cp1x = x1, cp1y = y1, cp2x = x2, cp2y = y2;
        
        if (isVertical) {
           cp1y = y1 + (y2 - y1) / 2;
           cp2y = y1 + (y2 - y1) / 2;
        } else {
           cp1x = x1 + (x2 - x1) / 2;
           cp2x = x1 + (x2 - x1) / 2;
        }

        const pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

        // Determine edge state based on 'toNode' status (or 'fromNode' if you prefer)
        // If fromNode is complete, edge is "unlocked". If toNode is complete, edge is "completed"
        let strokeClass = "stroke-white/10";
        let strokeWidth = 2;
        let style = {};

        if (fromNode.status === 'COMPLETED') {
          if (toNode.status === 'COMPLETED') {
             strokeClass = "stroke-[url(#completed-grad)]";
             strokeWidth = 3;
          } else if (toNode.status === 'IN_PROGRESS' || toNode.status === 'AVAILABLE') {
             strokeClass = "stroke-glow-violet";
             strokeWidth = 3;
             style = { filter: 'url(#glow)', strokeDasharray: '8, 8', animation: 'dash 1s linear infinite' };
          }
        }

        return (
          <g key={edge.id}>
            <path
              d={pathData}
              fill="none"
              className={strokeClass}
              strokeWidth={strokeWidth}
              style={style}
            />
            {/* Base invisible path for thicker hover target if needed in future */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              className="pointer-events-auto cursor-pointer"
            />
          </g>
        );
      })}
    </svg>
  );
};
