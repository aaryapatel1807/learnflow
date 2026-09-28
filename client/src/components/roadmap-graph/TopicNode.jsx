import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import './roadmap-sh.css';

// roadmap.sh style: beige branch box, black border,
// dashed border when optional, purple check badge when done.
function TopicNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';
  const isOptional = data.optional;

  return (
    <div className={clsx('rm-node rm-topic', isOptional && 'rm-optional', selected && 'rm-selected')}>
      <Handle type="target" position={Position.Left} className="rm-handle" />

      <span className="rm-label">{data.label}</span>

      {isDone ? (
        <span className="rm-badge rm-badge-done" title="Done">
          <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
        </span>
      ) : isInProgress ? (
        <span className="rm-badge rm-badge-progress" title="In progress">
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={3} />
        </span>
      ) : null}

      <Handle type="source" position={Position.Right} className="rm-handle" />
    </div>
  );
}

export default TopicNode;
