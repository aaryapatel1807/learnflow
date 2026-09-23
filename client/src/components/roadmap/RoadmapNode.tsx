import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Lock, PlayCircle } from 'lucide-react';
import { RoadmapNodeData } from '../../types';
import clsx from 'clsx';

interface Props {
  node: RoadmapNodeData;
  onClick: (node: RoadmapNodeData) => void;
  isSelected: boolean;
}

export const RoadmapNode: React.FC<Props> = ({ node, onClick, isSelected }) => {
  const isLocked = node.status === 'LOCKED';
  const isCompleted = node.status === 'COMPLETED';
  const isInProgress = node.status === 'IN_PROGRESS';
  const isAvailable = node.status === 'AVAILABLE';

  const statusColors = {
    LOCKED: 'border-white/10 bg-black/40 text-gray-500',
    AVAILABLE: 'border-white/30 bg-black/60 text-white hover:border-glow-violet hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]',
    IN_PROGRESS: 'border-glow-violet bg-glow-violet/20 text-white shadow-[0_0_20px_rgba(139,92,246,0.6)]',
    COMPLETED: 'border-glow-emerald bg-glow-emerald/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    SKIPPED: 'border-gray-500 bg-gray-500/20 text-gray-300',
  };

  return (
    <motion.div
      layoutId={`node-${node.id}`}
      className="absolute"
      style={{ left: node.position.x, top: node.position.y, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!isLocked ? { scale: 1.05 } : {}}
      whileTap={!isLocked ? { scale: 0.95 } : {}}
      onClick={() => !isLocked && onClick(node)}
    >
      <div
        className={clsx(
          'relative flex flex-col items-center justify-center p-4 rounded-xl border backdrop-blur-md cursor-pointer transition-colors duration-300',
          'w-48 text-center',
          statusColors[node.status],
          isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-black'
        )}
      >
        <div className="mb-2">
          {isLocked && <Lock className="w-6 h-6 text-gray-500" />}
          {isAvailable && <Circle className="w-6 h-6 text-gray-300" />}
          {isInProgress && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <PlayCircle className="w-6 h-6 text-glow-violet" />
            </motion.div>
          )}
          {isCompleted && <CheckCircle className="w-6 h-6 text-glow-emerald" />}
        </div>
        
        <h3 className="text-sm font-bold truncate w-full">{node.title}</h3>
        <span className="text-xs opacity-70 mt-1 uppercase tracking-wider">{node.category}</span>
        
        {/* Progress bar for subtasks */}
        {node.subTasks.length > 0 && (
          <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <motion.div 
              className={clsx(
                "h-full", 
                isCompleted ? "bg-glow-emerald" : "bg-glow-violet"
              )}
              initial={{ width: 0 }}
              animate={{ 
                width: `${(node.subTasks.filter(st => st.isCompleted).length / node.subTasks.length) * 100}%` 
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
