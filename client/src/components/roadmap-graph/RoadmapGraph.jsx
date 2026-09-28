import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  Panel,
  Position,
} from '@xyflow/react';
import { Check } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import TopicNode from './TopicNode';
import MilestoneNode from './MilestoneNode';
import './roadmap-sh.css';

const nodeTypes = {
  topic: TopicNode,
  milestone: MilestoneNode,
};

// ── Straight roadmap.sh-style layout ──────────────────────────────
// Milestones form one straight vertical spine (x = 0). Every topic fans
// out to the left or right of its parent, centred on the parent's row.
const SPINE_DY = 150;   // vertical gap between milestones
const BRANCH_DX = 300;  // horizontal distance parent centre -> topic centre
const TOPIC_DY = 66;    // vertical gap between fanned topics
const MILESTONE_W = 220;
const MILESTONE_H = 56;
const TOPIC_W = 200;
const TOPIC_H = 44;

const layoutStraight = (nodes) => {
  const byId = {};
  nodes.forEach((n) => {
    byId[n.id] = n;
  });

  const spine = nodes
    .filter((n) => n.type === 'milestone')
    .sort((a, b) => (a.data.raw.order ?? 0) - (b.data.raw.order ?? 0));

  const childrenOf = {};
  nodes.forEach((n) => {
    const rawPid = n.data.raw.parentId;
    if (!rawPid) return;
    const pid = typeof rawPid === 'object' ? rawPid._id : rawPid;
    if (!childrenOf[pid]) childrenOf[pid] = [];
    childrenOf[pid].push(n);
  });

  // 1. Straight vertical spine.
  spine.forEach((n, i) => {
    n.position = { x: -MILESTONE_W / 2, y: i * SPINE_DY };
    n.targetPosition = Position.Top;
    n.sourcePosition = Position.Bottom;
  });

  // 2. Topics fan out left/right of their parent.
  Object.entries(childrenOf).forEach(([pid, kids]) => {
    const parent = byId[pid];
    if (!parent) return;
    const cx = parent.position.x + MILESTONE_W / 2;
    const cy = parent.position.y + MILESTONE_H / 2;
    const rows = Math.ceil(kids.length / 2);
    kids.forEach((k, i) => {
      const side = i % 2 === 0 ? 'right' : 'left';
      const row = Math.floor(i / 2);
      const yOff = (row - (rows - 1) / 2) * TOPIC_DY;
      const tx = side === 'right' ? cx + BRANCH_DX : cx - BRANCH_DX;
      k.position = { x: tx - TOPIC_W / 2, y: cy + yOff - TOPIC_H / 2 };
      k.data.side = side;
      k.targetPosition = side === 'left' ? Position.Right : Position.Left;
      k.sourcePosition = Position.Right;
    });
  });

  // 3. Orphans (parent not found) stack below the spine instead of piling at 0,0.
  let orphanY = spine.length * SPINE_DY + 40;
  nodes.forEach((n) => {
    if (n.position.x === 0 && n.position.y === 0) {
      n.position = { x: -TOPIC_W / 2, y: orphanY };
      orphanY += TOPIC_DY;
    }
  });

  return nodes;
};

function RoadmapGraph({ rawNodes, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) return;

    const initialNodes = [];

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

    // 2. Straight spine layout (replaces the old winding dagre layout).
    layoutStraight(initialNodes);
    const byId = {};
    initialNodes.forEach((n) => {
      byId[n.id] = n;
    });

    const initialEdges = [];

    // 3. Spine edges: straight vertical blue line down the milestones.
    for (let i = 1; i < spineNodes.length; i++) {
      initialEdges.push({
        id: `spine-${spineNodes[i - 1]._id}-${spineNodes[i]._id}`,
        source: spineNodes[i - 1]._id,
        target: spineNodes[i]._id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'straight',
        style: { stroke: 'var(--rm-edge)', strokeWidth: 2.5 },
      });
    }

    // 4. Branch edges: dotted blue curve from the parent's side to each topic.
    rawNodes.forEach((dbNode) => {
      if (!dbNode.parentId) return;
      const parentId = typeof dbNode.parentId === 'object' ? dbNode.parentId._id : dbNode.parentId;
      const side = (byId[dbNode._id] && byId[dbNode._id].data.side) || 'right';
      initialEdges.push({
        id: `branch-${parentId}-${dbNode._id}`,
        source: parentId,
        target: dbNode._id,
        sourceHandle: side,
        type: 'default',
        style: {
          stroke: 'var(--rm-edge)',
          strokeWidth: 2.5,
          strokeDasharray: '0.1 8',
          strokeLinecap: 'round',
        },
      });
    });

    setNodes(initialNodes);
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
              <span className="inline-block w-4 h-3 rounded-sm border-2 shrink-0" style={{ background: 'var(--rm-milestone)', borderColor: 'var(--rm-node-border)' }} />
              Milestone
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-3 rounded-sm border-2 shrink-0" style={{ background: 'var(--rm-topic)', borderColor: 'var(--rm-node-border)' }} />
              Topic
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0" style={{ background: 'var(--rm-done)' }}>
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
              </span>
              Done
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0" style={{ background: 'var(--rm-edge)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
              In Progress
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-5 border-t-[3px] shrink-0" style={{ borderColor: 'var(--rm-edge)' }} />
              Learning path
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-5 border-t-[3px] border-dotted shrink-0" style={{ borderColor: 'var(--rm-edge)' }} />
              Optional
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default RoadmapGraph;
