import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import TopicNode from './TopicNode';
import SectionNode from './SectionNode';

const nodeTypes = {
  topic: TopicNode,
  section: SectionNode,
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    const isSection = node.type === 'section';
    dagreGraph.setNode(node.id, { width: isSection ? 300 : 200, height: isSection ? 80 : 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isSection = node.type === 'section';
    const width = isSection ? 300 : 200;
    const height = isSection ? 80 : 60;
    
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });
};

// Dummy status generator for demo purposes if backend doesn't provide it
const getRandomStatus = () => {
  const statuses = ['done', 'in-progress', 'not-started'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

function RoadmapGraph({ rawNodes, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) return;

    // Map raw DB nodes to React Flow nodes
    const initialNodes = [];
    const initialEdges = [];

    // Track last section to branch from if necessary, or just linear
    for (let i = 0; i < rawNodes.length; i++) {
      const dbNode = rawNodes[i];
      const isMilestone = !!dbNode.milestone;
      
      const rfNode = {
        id: dbNode._id,
        type: isMilestone ? 'section' : 'topic',
        data: {
          label: dbNode.title,
          description: dbNode.description,
          phase: dbNode.phase,
          status: dbNode.status || getRandomStatus(),
          type: 'default',
          raw: dbNode,
        },
        position: { x: 0, y: 0 },
      };
      
      initialNodes.push(rfNode);

      // Create linear edge to previous node
      if (i > 0) {
        initialEdges.push({
          id: `e-${rawNodes[i-1]._id}-${dbNode._id}`,
          source: rawNodes[i-1]._id,
          target: dbNode._id,
          type: 'smoothstep',
          animated: rfNode.data.status === 'in-progress',
          style: { stroke: rfNode.data.status === 'done' ? '#10b981' : '#9ca3af', strokeWidth: 2 },
        });
      }
    }

    const layoutedNodes = getLayoutedElements(initialNodes, initialEdges, 'TB');
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [rawNodes, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_, node) => {
      if (onNodeClick) {
        onNodeClick(node.data.raw);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-xl bg-gray-50/50 shadow-inner overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap zoomable pannable nodeClassName={(n) => n.type === 'section' ? '!bg-gray-800' : '!bg-blue-500'} />
        <Background color="#ccc" gap={16} />
        <Panel position="top-left" className="bg-white/90 backdrop-blur p-3 rounded-lg shadow border border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Done</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> In Progress</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-300"></span> Pending</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default RoadmapGraph;
