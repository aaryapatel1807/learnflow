// Roadmap Data Schema
export type NodeStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'video' | 'practice';
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface RoadmapNodeData {
  id: string;
  title: string;
  description: string;
  category: string;
  prerequisites: string[]; // Node IDs required before unlocking
  position: { x: number; y: number }; // Relative canvas coordinates or grid slots
  status: NodeStatus;
  subTasks: SubTask[];
  resources: ResourceItem[];
}

export interface RoadmapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  curveStyle?: 'bezier' | 'step' | 'straight';
}

// 3D Storytelling Schema
export interface StoryChapter {
  id: string;
  scrollRange: [number, number]; // [startOffset, endOffset] normalized 0 to 1
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  title: string;
  subtitle: string;
  description: string;
  tags?: string[];
}
