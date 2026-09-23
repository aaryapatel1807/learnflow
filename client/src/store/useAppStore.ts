import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RoadmapNodeData, RoadmapEdge, NodeStatus } from '../types';

interface AppState {
  // Roadmap State
  nodes: RoadmapNodeData[];
  edges: RoadmapEdge[];
  selectedNodeId: string | null;
  
  // Roadmap Actions
  setNodes: (nodes: RoadmapNodeData[]) => void;
  setEdges: (edges: RoadmapEdge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeStatus: (id: string, status: NodeStatus) => void;
  toggleSubTask: (nodeId: string, subTaskId: string) => void;

  // 3D Portfolio State
  currentChapter: string | null;
  setCurrentChapter: (chapterId: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      updateNodeStatus: (id, status) =>
        set((state) => {
          const updatedNodes = state.nodes.map((node) => {
            if (node.id === id) {
              return { ...node, status };
            }
            return node;
          });

          // Auto-unlock logic
          // If we completed a node, check if any dependent nodes now have all prerequisites met
          if (status === 'COMPLETED') {
            const unlockedNodes = updatedNodes.map((n) => {
              if (n.status === 'LOCKED' && n.prerequisites.length > 0) {
                const allPrereqsMet = n.prerequisites.every((prereqId) => {
                  const prereqNode = updatedNodes.find((pn) => pn.id === prereqId);
                  return prereqNode?.status === 'COMPLETED';
                });
                if (allPrereqsMet) {
                  return { ...n, status: 'AVAILABLE' as NodeStatus };
                }
              }
              return n;
            });
            return { nodes: unlockedNodes };
          }

          return { nodes: updatedNodes };
        }),

      toggleSubTask: (nodeId, subTaskId) =>
        set((state) => ({
          nodes: state.nodes.map((node) => {
            if (node.id === nodeId) {
              const updatedSubTasks = node.subTasks.map((st) =>
                st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
              );
              // Auto complete node if all subtasks are done? 
              // We'll let the user explicitly mark it complete for now.
              return { ...node, subTasks: updatedSubTasks };
            }
            return node;
          }),
        })),

      currentChapter: null,
      setCurrentChapter: (currentChapter) => set({ currentChapter }),
    }),
    {
      name: 'learnflow-storage',
    }
  )
);
