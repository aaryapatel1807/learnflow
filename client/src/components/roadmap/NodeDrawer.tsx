import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ExternalLink, Video, FileText, Code } from 'lucide-react';
import { NodeStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import clsx from 'clsx';

interface Props {
  nodeId: string | null;
  onClose: () => void;
}

export const NodeDrawer: React.FC<Props> = ({ nodeId, onClose }) => {
  const nodes = useAppStore(state => state.nodes);
  const updateNodeStatus = useAppStore(state => state.updateNodeStatus);
  const toggleSubTask = useAppStore(state => state.toggleSubTask);
  
  const node = nodes.find(n => n.id === nodeId);

  if (!node) return null;

  const isCompleted = node.status === 'COMPLETED';

  const handleStatusChange = (status: NodeStatus) => {
    updateNodeStatus(node.id, status);
  };

  return (
    <AnimatePresence>
      {nodeId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900/90 border-l border-white/10 shadow-2xl p-6 z-50 overflow-y-auto backdrop-blur-xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>

            <div className="mt-8">
              <span className="text-xs font-bold uppercase tracking-wider text-glow-violet">
                {node.category}
              </span>
              <h2 className="text-2xl font-bold mt-2 text-white">{node.title}</h2>
              <p className="text-gray-400 mt-4 leading-relaxed">
                {node.description}
              </p>

              {/* Status Actions */}
              <div className="flex gap-3 mt-8">
                {node.status !== 'LOCKED' && !isCompleted && (
                  <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    className="flex-1 py-2 px-4 bg-glow-emerald/20 hover:bg-glow-emerald/30 border border-glow-emerald text-emerald-400 rounded-lg transition-colors flex justify-center items-center gap-2 font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Complete
                  </button>
                )}
                {node.status === 'AVAILABLE' && (
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    className="flex-1 py-2 px-4 bg-glow-violet/20 hover:bg-glow-violet/30 border border-glow-violet text-violet-400 rounded-lg transition-colors flex justify-center items-center gap-2 font-medium"
                  >
                    Start Learning
                  </button>
                )}
              </div>

              {/* Subtasks */}
              {node.subTasks.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-white mb-4">Tasks</h3>
                  <div className="space-y-3">
                    {node.subTasks.map(task => (
                      <label key={task.id} className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border-2 rounded border-gray-600 group-hover:border-glow-violet transition-colors">
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={task.isCompleted}
                            onChange={() => toggleSubTask(node.id, task.id)}
                            disabled={node.status === 'LOCKED'}
                          />
                          {task.isCompleted && <CheckCircle className="w-4 h-4 text-glow-violet absolute" />}
                        </div>
                        <span className={clsx("text-sm", task.isCompleted ? "text-gray-500 line-through" : "text-gray-300")}>
                          {task.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {node.resources.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
                  <div className="space-y-3">
                    {node.resources.map(res => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                      >
                        <div className="p-2 bg-gray-800 rounded-md mr-3 text-gray-400 group-hover:text-glow-violet transition-colors">
                          {res.type === 'video' && <Video className="w-4 h-4" />}
                          {res.type === 'article' && <FileText className="w-4 h-4" />}
                          {res.type === 'practice' && <Code className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{res.title}</h4>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
