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
import MilestoneNode from './MilestoneNode';

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

    // 2. Spine edges: milestone -> next milestone (solid line down the main path)
    for (let i = 1; i < spineNodes.length; i++) {
      initialEdges.push({
        id: `spine-${spineNodes[i - 1]._id}-${spineNodes[i]._id}`,
        source: spineNodes[i - 1]._id,
        target: spineNodes[i]._id,
        type: 'smoothstep',
        style: { stroke: spineNodes[i].status === 'done' ? '#1A5C54' : '#A89880', strokeWidth: 3 },
      });
    }

    // 3. Branch edges: every node with a parentId gets a dotted line off its parent —
    //    this is what actually produces the tree/branching look, one parent to many children.
    rawNodes.forEach((dbNode) => {
      if (!dbNode.parentId) return;
      const parentId = typeof dbNode.parentId === 'object' ? dbNode.parentId._id : dbNode.parentId;
      initialEdges.push({
        id: `branch-${parentId}-${dbNode._id}`,
        source: parentId,
        target: dbNode._id,
        type: 'smoothstep',
        style: {
          stroke: dbNode.status === 'done' ? '#2B8A7E' : '#D4C9A8',
          strokeWidth: 1.5,
          strokeDasharray: '4 3',
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
    <div className="w-full h-[750px] border border-[var(--color-ink-300)] rounded-xl bg-[var(--color-parchment-50)] shadow-inner overflow-hidden">
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
        <MiniMap zoomable pannable nodeClassName={(n) => n.type === 'milestone' ? '!bg-[var(--color-ink-700)]' : '!bg-[var(--color-verdigris-500)]'} />
        <Background color="var(--color-ink-300)" gap={16} />
        <Panel position="top-left" className="bg-[var(--color-parchment-50)]/90 backdrop-blur p-3 rounded-lg shadow border border-[var(--color-ink-300)]">
          <div className="text-xs font-semibold text-[var(--color-ink-700)] mb-2">Legend</div>
          <div className="flex flex-col gap-1 text-xs text-[var(--color-ink-700)]">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-verdigris-500)]"></span> Done</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-ember-500)]"></span> In Progress</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-ink-300)]"></span> Pending</div>
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-ink-300)] mt-1">
              <span className="w-4 border-t-2 border-dashed border-[var(--color-ink-300)]"></span> Optional
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default RoadmapGraph;
