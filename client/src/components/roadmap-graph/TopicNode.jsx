import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// Branching sub-topic pill — the roadmap.sh "What is HTTP?" style node that hangs
// off a milestone via a dotted line.
function TopicNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';
  const isOptional = data.optional;

  return (
    <div
      className={clsx(
        'relative min-w-[180px] max-w-[220px] px-3 py-2 rounded-full border-2 transition-all duration-200 cursor-pointer shadow-sm',
        {
          'bg-[var(--color-verdigris-100)] border-[var(--color-verdigris-500)]': isDone,
          'bg-[var(--color-ember-100)] border-[var(--color-ember-500)]': isInProgress,
          'bg-[var(--color-parchment-100)] border-[var(--color-ink-300)]': !isDone && !isInProgress,
          'border-dashed opacity-80': isOptional,
          'ring-4 ring-[var(--color-ember-400)]/40 scale-105': selected,
        }
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-3 !h-3" />

      <div className="flex items-center gap-2">
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 text-[var(--color-verdigris-700)] flex-shrink-0" />
        ) : isInProgress ? (
          <Loader2 className="w-4 h-4 text-[var(--color-ember-600)] flex-shrink-0 animate-spin" />
        ) : (
          <Circle className="w-4 h-4 text-[var(--color-ink-300)] flex-shrink-0" />
        )}
        <span
          className={clsx('text-xs font-semibold truncate', {
            'text-[var(--color-verdigris-700)]': isDone,
            'text-[var(--color-ember-600)]': isInProgress,
            'text-[var(--color-ink-700)]': !isDone && !isInProgress,
          })}
        >
          {data.label}
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-3 !h-3" />
    </div>
  );
}

export default TopicNode;
