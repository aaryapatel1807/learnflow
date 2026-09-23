import { RoadmapNodeData, RoadmapEdge } from '../types';

export const mockRoadmapData: RoadmapNodeData[] = [
  {
    id: '1',
    title: 'Internet Fundamentals',
    description: 'Learn how the internet works, HTTP/HTTPS, DNS, and hosting.',
    category: 'Core',
    prerequisites: [],
    position: { x: 500, y: 100 },
    status: 'COMPLETED',
    subTasks: [
      { id: '1-1', title: 'What is a Domain Name?', isCompleted: true },
      { id: '1-2', title: 'What is Hosting?', isCompleted: true },
      { id: '1-3', title: 'DNS and how it works', isCompleted: true },
    ],
    resources: [
      { id: 'r1', title: 'How the Web Works', url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works', type: 'article' }
    ]
  },
  {
    id: '2',
    title: 'HTML & CSS Basics',
    description: 'Structure and style web pages.',
    category: 'Frontend Core',
    prerequisites: ['1'],
    position: { x: 500, y: 300 },
    status: 'IN_PROGRESS',
    subTasks: [
      { id: '2-1', title: 'Semantic HTML', isCompleted: true },
      { id: '2-2', title: 'CSS Flexbox & Grid', isCompleted: false },
      { id: '2-3', title: 'Responsive Design', isCompleted: false },
    ],
    resources: []
  },
  {
    id: '3',
    title: 'JavaScript',
    description: 'Add interactivity to your websites.',
    category: 'Frontend Core',
    prerequisites: ['2'],
    position: { x: 500, y: 500 },
    status: 'AVAILABLE',
    subTasks: [
      { id: '3-1', title: 'Variables & Data Types', isCompleted: false },
      { id: '3-2', title: 'Functions & Scope', isCompleted: false },
      { id: '3-3', title: 'DOM Manipulation', isCompleted: false },
      { id: '3-4', title: 'ES6+ Features', isCompleted: false },
    ],
    resources: []
  },
  {
    id: '4',
    title: 'React ecosystem',
    description: 'Component-based UI library and its ecosystem.',
    category: 'Framework',
    prerequisites: ['3'],
    position: { x: 400, y: 700 },
    status: 'LOCKED',
    subTasks: [
      { id: '4-1', title: 'Components & JSX', isCompleted: false },
      { id: '4-2', title: 'Hooks (useState, useEffect)', isCompleted: false },
      { id: '4-3', title: 'Context API', isCompleted: false },
    ],
    resources: []
  },
  {
    id: '5',
    title: 'TypeScript',
    description: 'Typed JavaScript at Any Scale.',
    category: 'Language',
    prerequisites: ['3'],
    position: { x: 600, y: 700 },
    status: 'LOCKED',
    subTasks: [
      { id: '5-1', title: 'Types vs Interfaces', isCompleted: false },
      { id: '5-2', title: 'Generics', isCompleted: false },
    ],
    resources: []
  },
  {
    id: '6',
    title: 'Advanced React Architecture',
    description: 'State management, SSR, SSG, and performance.',
    category: 'Architecture',
    prerequisites: ['4', '5'],
    position: { x: 500, y: 900 },
    status: 'LOCKED',
    subTasks: [
      { id: '6-1', title: 'Zustand / Redux', isCompleted: false },
      { id: '6-2', title: 'Next.js / Remix', isCompleted: false },
    ],
    resources: []
  }
];

export const mockEdges: RoadmapEdge[] = [
  { id: 'e1', fromNodeId: '1', toNodeId: '2' },
  { id: 'e2', fromNodeId: '2', toNodeId: '3' },
  { id: 'e3', fromNodeId: '3', toNodeId: '4' },
  { id: 'e4', fromNodeId: '3', toNodeId: '5' },
  { id: 'e5', fromNodeId: '4', toNodeId: '6' },
  { id: 'e6', fromNodeId: '5', toNodeId: '6' },
];
