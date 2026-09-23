import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Circle, PlayCircle } from 'lucide-react';
import clsx from 'clsx';

function TopicNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';
  const isOptional = data.type === 'optional';

  return (
    <div
      className={clsx(
        'relative min-w-[200px] max-w-[240px] px-4 py-3 rounded-full border-2 transition-all duration-200 cursor-pointer shadow-sm',
        {
          'bg-white border-emerald-500 hover:shadow-emerald-100': isDone,
          'bg-white border-blue-500 hover:shadow-blue-100': isInProgress,
          'bg-gray-50 border-gray-300 hover:border-gray-400': !isDone && !isInProgress,
          'border-dashed': isOptional,
          'ring-4 ring-opacity-50 ring-blue-400 scale-105': selected,
        }
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none !w-4 !h-4" />
      
      <div className="flex items-center gap-2">
        {isDone ? (
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : isInProgress ? (
          <PlayCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className={clsx('text-sm font-semibold truncate', {
            'text-emerald-700': isDone,
            'text-blue-700': isInProgress,
            'text-gray-700': !isDone && !isInProgress,
          })}>
            {data.label}
          </h4>
        </div>
      </div>
      
      {data.phase && (
        <span className="absolute -top-3 -right-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md">
          {data.phase}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none !w-4 !h-4" />
    </div>
  );
}

export default TopicNode;
