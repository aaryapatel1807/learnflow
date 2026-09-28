import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import './roadmap-sh.css';

// roadmap.sh style: solid yellow main-path box, black border,
// purple check badge when done.
function MilestoneNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';

  return (
    <div className={clsx('rm-node rm-milestone', selected && 'rm-selected')}>
      <Handle type="target" position={Position.Top} id="top" className="rm-handle" />

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

      {data.phase && <span className="rm-phase">{data.phase}</span>}

      <Handle type="source" position={Position.Bottom} id="bottom" className="rm-handle" />
      <Handle type="source" position={Position.Left} id="left" className="rm-handle" />
      <Handle type="source" position={Position.Right} id="right" className="rm-handle" />
    </div>
  );
}

export default MilestoneNode;
