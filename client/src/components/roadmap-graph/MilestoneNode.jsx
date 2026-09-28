import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check, Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import './roadmap-sh.css';
import NodeHoverBar from './NodeHoverBar';

// roadmap.sh style: solid yellow main-path box, black border,
// purple check badge when done.
function MilestoneNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';
  const isSkipped = data.status === 'skipped';
  const pick = (status) => data.onStatusChange?.(data.raw._id, status);

  return (
    <div className={clsx('rm-node rm-milestone', isDone && 'rm-done', isSkipped && 'rm-skipped', selected && 'rm-selected')}>
      <Handle type="target" position={Position.Top} id="top" className="rm-handle" />

      <NodeHoverBar status={data.status} onPick={pick} />

      <span className="rm-label">{data.label}</span>

      {isDone ? (
        <span className="rm-badge rm-badge-done" title="Done">
          <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
        </span>
      ) : isInProgress ? (
        <span className="rm-badge rm-badge-progress" title="In progress">
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={3} />
        </span>
      ) : isSkipped ? (
        <span className="rm-badge rm-badge-skipped" title="Skipped">
          <X className="w-3.5 h-3.5" strokeWidth={3.5} />
        </span>
      ) : null}

      {data.phase && <span className="rm-phase">{data.phase}</span>}

      <Handle type="source" position={Position.Bottom} id="bottom" className="rm-handle" />
      <Handle type="source" position={Position.Left} id="left" className="rm-handle" />
      <Handle type="source" position={Position.Right} id="right" className="rm-handle" />
    </div>
  );
}

export default MilestoneNode;
