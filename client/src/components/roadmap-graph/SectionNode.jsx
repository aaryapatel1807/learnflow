import React from 'react';
import { Handle, Position } from '@xyflow/react';

function SectionNode({ data }) {
  return (
    <div className="relative px-6 py-4 bg-transparent border-none text-center">
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none !w-4 !h-4" />
      
      <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
        {data.label}
      </h3>
      {data.description && (
        <p className="text-sm text-gray-500 mt-1 max-w-[250px] mx-auto">
          {data.description}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none !w-4 !h-4" />
    </div>
  );
}

export default SectionNode;
