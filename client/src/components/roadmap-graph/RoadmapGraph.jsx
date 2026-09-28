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
import { Check } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import TopicNode from './TopicNode';
import MilestoneNode from './MilestoneNode';
import './roadmap-sh.css';

const nodeTypes = {
  topic: TopicNode,
  milestone: MilestoneNode,
};

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // LR so milestones form the main vertical/horizontal spine and topics branch sideways,
  // matching roadmap.sh's layout instead of one straight column.
  dagreGraph.setGraph({ rankdir: direction, ranksep: 90, nodesep: 30 });

  nodes.forEach((node) => {
    const isMilestone = node.type === 'milestone';
    dagreGraph.setNode(node.id, { width: isMilestone ? 220 : 200, height: isMilestone ? 56 : 44 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isMilestone = node.type === 'milestone';
    const width = isMilestone ? 220 : 200;
    const height = isMilestone ? 56 : 44;

    return {
      ...node,
      targetPosition: direction === 'LR' ? 'left' : 'top',
      sourcePosition: direction === 'LR' ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });
};

function RoadmapGraph({ rawNodes, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) return;

    const initialNodes = [];
    const initialEdges = [];

    // 1. Classify by real nodeType from the DB, not by whether `milestone` text exists.
    //    Milestones (no parentId) form the main spine; everything with a parentId is a
    //    branch off its parent.
    const spineNodes = rawNodes
      .filter((n) => !n.parentId && (n.nodeType || 'milestone') === 'milestone')
      .sort((a, b) => a.order - b.order);

    rawNodes.forEach((dbNode) => {
      const nodeType = dbNode.nodeType || (dbNode.parentId ? 'topic' : 'milestone');
      initialNodes.push({
        id: dbNode._id,
        type: nodeType === 'milestone' ? 'milestone' : 'topic',
        data: {
          label: dbNode.title,
          description: dbNode.description,
          phase: dbNode.phase,
          status: dbNode.status || 'not-started',
          optional: nodeType === 'optional',
          raw: dbNode,
        },
        position: { x: 0, y: 0 },
      });
    });

    // 2. Spine edges: milestone -> next milestone (solid blue down the main path,
    //    roadmap.sh style)
    for (let i = 1; i < spineNodes.length; i++) {
      initialEdges.push({
        id: `spine-${spineNodes[i - 1]._id}-${spineNodes[i]._id}`,
        source: spineNodes[i - 1]._id,
        target: spineNodes[i]._id,
        type: 'default',
        style: { stroke: 'var(--rm-edge)', strokeWidth: 2.5 },
      });
    }

    // 3. Branch edges: every node with a parentId gets a dotted blue line off its parent —
    //    this is what actually produces the tree/branching look, one parent to many children.
    rawNodes.forEach((dbNode) => {
      if (!dbNode.parentId) return;
      const parentId = typeof dbNode.parentId === 'object' ? dbNode.parentId._id : dbNode.parentId;
      initialEdges.push({
        id: `branch-${parentId}-${dbNode._id}`,
        source: parentId,
        target: dbNode._id,
        type: 'default',
        style: {
          stroke: 'var(--rm-edge)',
          strokeWidth: 2.5,
          strokeDasharray: '0.1 8',
          strokeLinecap: 'round',
        },
      });
    });

    const layoutedNodes = getLayoutedElements(initialNodes, initialEdges, 'LR');
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
    <div
      className="w-full h-[750px] rounded-xl overflow-hidden border"
      style={{ background: 'var(--rm-canvas)', borderColor: 'var(--rm-frame)' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap
          zoomable
          pannable
          nodeColor={(n) => (n.type === 'milestone' ? '#ffe800' : '#fff3c2')}
          maskColor="rgba(0, 0, 0, 0.08)"
        />
        <Background color="var(--rm-dot)" gap={22} />
        <Panel
          position="top-left"
          className="rounded-lg shadow-md px-3 py-2.5"
          style={{ background: 'var(--rm-panel)', border: '1px solid var(--rm-frame)' }}
        >
          <div className="text-xs font-bold mb-2" style={{ color: 'var(--rm-panel-text)' }}>Legend</div>
          <div className="flex flex-col gap-1.5 text-xs font-medium" style={{ color: 'var(--rm-panel-text)' }}>
            <div className="flex items-center gap-2">
              <span className="w-4 h-3 rounded-sm border-2" style={{ background: 'var(--rm-milestone)', borderColor: 'var(--rm-node-border)' }} />
              Milestone
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-3 rounded-sm border-2" style={{ background: 'var(--rm-topic)', borderColor: 'var(--rm-node-border)' }} />
              Topic
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full inline-flex items-center justify-center" style={{ background: 'var(--rm-done)' }}>
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
              </span>
              Done
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 border-t-[3px]" style={{ borderColor: 'var(--rm-edge)' }} />
              Learning path
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 border-t-[3px] border-dotted" style={{ borderColor: 'var(--rm-edge)' }} />
              Optional
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default RoadmapGraph;
