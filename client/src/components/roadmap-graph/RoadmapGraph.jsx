import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Position,
} from '@xyflow/react';
import { Check, X } from 'lucide-react';
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
const SPINE_GAP = 40;   // breathing room between neighbouring fan-out areas
const BRANCH_DX = 320;  // horizontal distance parent centre -> topic centre
const TOPIC_DY = 72;    // vertical gap between fanned topics
const MILESTONE_W = 220;
const MILESTONE_H = 56;
const TOPIC_W = 200;
const TOPIC_H = 44;

const layoutStraight = (nodes) => {
  const spine = nodes
    .filter((n) => n.type === 'milestone' && !n.data.raw.parentId)
    .sort((a, b) => (a.data.raw.order ?? 0) - (b.data.raw.order ?? 0));

  const childrenOf = {};
  nodes.forEach((n) => {
    const rawPid = n.data.raw.parentId;
    if (!rawPid) return;
    const pid = typeof rawPid === 'object' ? rawPid._id : rawPid;
    if (!childrenOf[pid]) childrenOf[pid] = [];
    childrenOf[pid].push(n);
  });
  Object.values(childrenOf).forEach((kids) =>
    kids.sort((a, b) => (a.data.raw.order ?? 0) - (b.data.raw.order ?? 0))
  );

  // Vertical half-extent a milestone needs: its fanned topics, or the box
  // itself, whichever is taller. Used to keep neighbouring fan-out areas
  // from overlapping.
  const rowsFor = (pid) => Math.ceil((childrenOf[pid] || []).length / 2);
  const halfFor = (pid) =>
    Math.max(((rowsFor(pid) - 1) / 2) * TOPIC_DY + TOPIC_H / 2, MILESTONE_H / 2);

  // Bounds tracking so the canvas can be sized to the full static diagram.
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const track = (x, y, w, h) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  };

  // 1. Straight vertical spine with adaptive spacing.
  let cursor = 0;
  let lastBottom = 0;
  spine.forEach((n, i) => {
    const half = halfFor(n.id);
    const cy = cursor + half;
    n.position = { x: -MILESTONE_W / 2, y: cy - MILESTONE_H / 2 };
    track(n.position.x, n.position.y, MILESTONE_W, MILESTONE_H);
    n.targetPosition = Position.Top;
    n.sourcePosition = Position.Bottom;

    // 2. Topics fan out left/right of their parent, centred on its row.
    const kids = childrenOf[n.id] || [];
    const rows = rowsFor(n.id);
    kids.forEach((k, ki) => {
      const side = ki % 2 === 0 ? 'right' : 'left';
      const row = Math.floor(ki / 2);
      const yOff = (row - (rows - 1) / 2) * TOPIC_DY;
      const tx = side === 'right' ? BRANCH_DX : -BRANCH_DX;
      k.position = { x: tx - TOPIC_W / 2, y: cy + yOff - TOPIC_H / 2 };
      track(k.position.x, k.position.y, TOPIC_W, TOPIC_H);
      k.data.side = side;
      k.targetPosition = side === 'left' ? Position.Right : Position.Left;
      k.sourcePosition = Position.Right;
    });

    const nextHalf = i + 1 < spine.length ? halfFor(spine[i + 1].id) : 0;
    cursor = cy + half + SPINE_GAP + nextHalf;
    lastBottom = cy + half;
  });

  // 3. Orphans (parent not found — e.g. stale parentId) stack in their own
  //    lane below the spine, clearly off the blue line, instead of sitting
  //    on it like misplaced topics.
  let orphanY = lastBottom + 60;
  nodes.forEach((n) => {
    if (n.position.x === 0 && n.position.y === 0) {
      n.position = { x: 60, y: orphanY };
      track(n.position.x, n.position.y, TOPIC_W, TOPIC_H);
      orphanY += TOPIC_DY;
    }
  });

  return { minX, minY, maxX, maxY };
};

function RoadmapGraph({ rawNodes, onNodeClick, onStatusChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [bounds, setBounds] = useState(null);
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(0);

  // Measure the canvas width so the static graph can be centred in it.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWrapW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      setBounds(null);
      return;
    }

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
          onStatusChange,
        },
        position: { x: 0, y: 0 },
      });
    });

    // 2. Straight spine layout (replaces the old winding dagre layout).
    const graphBounds = layoutStraight(initialNodes);
    setBounds(graphBounds);
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
          strokeWidth: 3,
          strokeDasharray: '0.1 7',
          strokeLinecap: 'round',
        },
      });
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [rawNodes, onStatusChange, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_, node) => {
      if (onNodeClick) {
        onNodeClick(node.data.raw);
      }
    },
    [onNodeClick]
  );

  // Static diagram: the canvas is sized to the full graph at 1:1 scale and
  // every pan/zoom interaction is disabled, so the mouse wheel scrolls the
  // page instead of hijacking into the diagram. Node clicks still work.
  // The graph is centred horizontally in the canvas via a measured viewport.
  const PAD = 40;
  const viewX =
    bounds && wrapW > 0 ? wrapW / 2 - (bounds.minX + bounds.maxX) / 2 : 0;

  return (
    <>
      <div className="rm-legend">
        <span className="rm-legend-title">Legend</span>
        <span className="rm-legend-row">
          <span className="rm-sw rm-sw-box rm-sw-milestone" />
          Milestone
        </span>
        <span className="rm-legend-row">
          <span className="rm-sw rm-sw-box rm-sw-topic" />
          Topic
        </span>
        <span className="rm-legend-row">
          <span className="rm-sw rm-sw-dot rm-sw-done">
            <Check className="w-2.5 h-2.5" strokeWidth={4} />
          </span>
          Done
        </span>
        <span className="rm-legend-row">
          <span className="rm-sw rm-sw-dot rm-sw-progress">
            <span className="rm-sw-inner" />
          </span>
          In Progress
        </span>
        <span className="rm-legend-row">
          <span className="rm-sw rm-sw-dot rm-sw-skipped">
            <X className="w-2.5 h-2.5" strokeWidth={4} />
          </span>
          Skipped
        </span>
        <span className="rm-legend-row">
          <span className="rm-sw rm-sw-line" />
          Learning path
        </span>
        <span className="rm-legend-row">
          <span className="rm-sw rm-sw-dotted" />
          Optional
        </span>
      </div>
      <div
        ref={wrapRef}
        className="w-full rounded-xl border"
        style={{
          background: 'var(--rm-canvas)',
          borderColor: 'var(--rm-frame)',
          height: bounds ? Math.ceil(bounds.maxY - bounds.minY + PAD * 2) : 750,
        }}
      >
      {bounds && wrapW > 0 && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          viewport={{ x: viewX, y: -bounds.minY + PAD, zoom: 1 }}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          attributionPosition="bottom-right"
        >
          <Background color="var(--rm-dot)" gap={22} />
        </ReactFlow>
      )}
      </div>
    </>
  );
}

export default RoadmapGraph;
