import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// Solid filled spine node — the roadmap.sh "Internet / HTML / CSS" style box,
// styled with the site's own ember/verdigris/ink palette instead of a generic theme.
function MilestoneNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';

  return (
    <div
      className={clsx(
        'relative min-w-[200px] px-5 py-3 rounded-md border-2 shadow-sm transition-all duration-200 cursor-pointer',
        {
          'bg-[var(--color-verdigris-100)] border-[var(--color-verdigris-700)]': isDone,
          'bg-[var(--color-ember-100)] border-[var(--color-ember-600)]': isInProgress,
          'bg-[var(--color-parchment-200)] border-[var(--color-ink-300)]': !isDone && !isInProgress,
          'ring-4 ring-[var(--color-ember-400)]/50 scale-105': selected,
        }
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-3 !h-3" />

      <div className="flex items-center gap-2">
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-[var(--color-verdigris-700)] flex-shrink-0" />
        ) : isInProgress ? (
          <Loader2 className="w-5 h-5 text-[var(--color-ember-600)] flex-shrink-0 animate-spin" />
        ) : (
          <Circle className="w-5 h-5 text-[var(--color-ink-300)] flex-shrink-0" />
        )}
        <h3
          className={clsx('text-base font-bold tracking-tight', {
            'text-[var(--color-verdigris-700)]': isDone,
            'text-[var(--color-ember-600)]': isInProgress,
            'text-[var(--color-ink-700)]': !isDone && !isInProgress,
          })}
        >
          {data.label}
        </h3>
      </div>

      {data.phase && (
        <span className="absolute -top-3 -right-2 bg-[var(--color-ink-900)] text-[var(--color-parchment-50)] text-[10px] px-2 py-1 rounded-full font-bold shadow-md">
          {data.phase}
        </span>
      )}

      <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-3 !h-3" />
    </div>
  );
}

export default MilestoneNode;
