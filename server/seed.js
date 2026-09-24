require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Book = require('./models/Book');
const Chapter = require('./models/Chapter');
const LearningPath = require('./models/LearningPath');
const LearningPathNode = require('./models/LearningPathNode');
const Roadmap = require('./models/Roadmap');
const RoadmapNode = require('./models/RoadmapNode');
const Flashcard = require('./models/Flashcard');
const Quiz = require('./models/Quiz');
const QuizQuestion = require('./models/QuizQuestion');
const Achievement = require('./models/Achievement');
const Note = require('./models/Note');
const Bookmark = require('./models/Bookmark');
const ActivityLog = require('./models/ActivityLog');
const SkillNode = require('./models/SkillNode');
const User = require('./models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Subject.deleteMany({});
    await Book.deleteMany({});
    await Chapter.deleteMany({});
    await LearningPath.deleteMany({});
    await LearningPathNode.deleteMany({});
    await Roadmap.deleteMany({});
    await RoadmapNode.deleteMany({});
    await Flashcard.deleteMany({});
    await Quiz.deleteMany({});
    await QuizQuestion.deleteMany({});
    await Achievement.deleteMany({});
    await Note.deleteMany({});
    await Bookmark.deleteMany({});
    await ActivityLog.deleteMany({});
    await SkillNode.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create subject
    const subject = await Subject.create({
      name: 'Web Development',
      description: 'Learn modern web development technologies'
    });
    console.log('📚 Created subject:', subject.name);

    // Create book
    const book = await Book.create({
      title: 'Introduction to React',
      author: 'Jane Developer',
      subject: subject._id,
      difficulty: 'Beginner',
      description: 'A comprehensive guide to building modern web applications with React. Learn components, hooks, state management, and more.',
      coverImage: 'https://via.placeholder.com/300x400/4299e1/ffffff?text=React+Guide'
    });
    console.log('📖 Created book:', book.title);

    // Create chapters with content
    const chapters = [
      {
        book: book._id,
        chapterNumber: 1,
        title: 'Getting Started with React',
        content: `# Chapter 1: Getting Started with React

Welcome to your journey into React! React is a powerful JavaScript library for building user interfaces.

## What is React?

React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components".

## Why Use React?

- **Component-Based**: Build encapsulated components that manage their own state
- **Declarative**: React makes it painless to create interactive UIs
- **Learn Once, Write Anywhere**: Develop new features without rewriting existing code

## Setting Up Your Environment

To start with React, you'll need:
1. Node.js installed on your computer
2. A code editor (VS Code recommended)
3. Basic knowledge of JavaScript

## Your First React Component

\`\`\`jsx
function Welcome() {
  return <h1>Hello, React!</h1>;
}
\`\`\`

This simple component returns a heading. In the next chapters, we'll build more complex components!`,
        pages: 5
      },
      {
        book: book._id,
        chapterNumber: 2,
        title: 'Understanding Components',
        content: `# Chapter 2: Understanding Components

Components are the building blocks of React applications. Let's dive deep into how they work.

## Functional Components

Modern React uses functional components with hooks. Here's a basic example:

\`\`\`jsx
function Greeting({ name }) {
  return <h2>Hello, {name}!</h2>;
}
\`\`\`

## Props

Props (short for properties) are how we pass data to components:

\`\`\`jsx
<Greeting name="Alice" />
\`\`\`

## Component Composition

You can compose components together to build complex UIs:

\`\`\`jsx
function App() {
  return (
    <div>
      <Greeting name="Alice" />
      <Greeting name="Bob" />
    </div>
  );
}
\`\`\`

## Key Concepts

- Components are reusable
- They can be nested
- Props flow down from parent to child
- Keep components small and focused

Practice building different components and see how they work together!`,
        pages: 6
      },
      {
        book: book._id,
        chapterNumber: 3,
        title: 'State and Hooks',
        content: `# Chapter 3: State and Hooks

State allows components to create and manage their own data. Hooks are functions that let you use React features.

## The useState Hook

The most common hook is useState:

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

## Understanding State Updates

When you call the setter function (like \`setCount\`), React re-renders the component with the new state.

## The useEffect Hook

useEffect lets you perform side effects in your components:

\`\`\`jsx
import { useEffect, useState } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return <div>Seconds: {seconds}</div>;
}
\`\`\`

## Rules of Hooks

1. Only call hooks at the top level
2. Only call hooks from React functions
3. Use the ESLint plugin to enforce these rules

Master these hooks and you'll be able to build interactive, dynamic applications!`,
        pages: 7
      }
    ];

    for (const chapterData of chapters) {
      const chapter = await Chapter.create(chapterData);
      console.log(`  ✓ Chapter ${chapter.chapterNumber}: ${chapter.title}`);
    }

    // Create Learning Path
    const learningPath = await LearningPath.create({
      title: 'React Fundamentals Learning Path',
      description: 'Master the core concepts of React from basics to advanced hooks',
      subject: subject._id,
      difficulty: 'Beginner',
      estimatedDuration: '2 weeks'
    });
    console.log('\n📍 Created learning path:', learningPath.title);

    // Get the created chapters for linking
    const allChapters = await Chapter.find({ book: book._id }).sort('chapterNumber');

    // Create Learning Path Nodes with prerequisite relationships
    const node1 = await LearningPathNode.create({
      learningPath: learningPath._id,
      title: 'Getting Started with React',
      description: 'Learn the basics of React and set up your first component',
      order: 1,
      prerequisiteNodeIds: [], // No prerequisites for first node
      contentType: 'chapter',
      book: book._id,
      chapter: allChapters[0]._id
    });
    console.log(`  ✓ Node 1: ${node1.title} (no prerequisites)`);

    const node2 = await LearningPathNode.create({
      learningPath: learningPath._id,
      title: 'Understanding Components',
      description: 'Deep dive into React components and composition',
      order: 2,
      prerequisiteNodeIds: [node1._id], // Requires Node 1 to be complete
      contentType: 'chapter',
      book: book._id,
      chapter: allChapters[1]._id
    });
    console.log(`  ✓ Node 2: ${node2.title} (requires Node 1)`);

    const node3 = await LearningPathNode.create({
      learningPath: learningPath._id,
      title: 'State and Hooks',
      description: 'Master React state management with hooks',
      order: 3,
      prerequisiteNodeIds: [node2._id], // Requires Node 2 to be complete
      contentType: 'chapter',
      book: book._id,
      chapter: allChapters[2]._id
    });
    console.log(`  ✓ Node 3: ${node3.title} (requires Node 2)`);

    // Create Roadmap
    const roadmap = await Roadmap.create({
      title: 'Frontend Developer Journey',
      description: 'Your path from beginner to job-ready frontend developer',
      category: 'Web Development',
      targetAudience: 'Beginners to Intermediate developers',
      estimatedDuration: '6 months'
    });
    console.log('\n🗺️  Created roadmap:', roadmap.title);

    // Create Roadmap Nodes linking to Learning Paths
    const roadmapNode1 = await RoadmapNode.create({
      roadmap: roadmap._id,
      title: 'Master React Fundamentals',
      description: 'Build a strong foundation in React development',
      order: 1,
      phase: 'Foundation',
      learningPath: learningPath._id,
      milestone: 'Complete all React fundamental concepts',
      nodeType: 'milestone',
      status: 'done'
    });
    console.log(`  ✓ Milestone 1: ${roadmapNode1.title}`);

    // Branch sub-topics off Milestone 1 (parentId = roadmapNode1)
    const m1Topics = await RoadmapNode.insertMany([
      { roadmap: roadmap._id, title: 'JSX & Components', order: 101, parentId: roadmapNode1._id, nodeType: 'topic', status: 'done' },
      { roadmap: roadmap._id, title: 'Props & State', order: 102, parentId: roadmapNode1._id, nodeType: 'topic', status: 'done' },
      { roadmap: roadmap._id, title: 'Hooks (useState, useEffect)', order: 103, parentId: roadmapNode1._id, nodeType: 'topic', status: 'in-progress' },
      { roadmap: roadmap._id, title: 'Context API', order: 104, parentId: roadmapNode1._id, nodeType: 'optional', status: 'not-started' },
    ]);
    console.log(`    ↳ ${m1Topics.length} sub-topics branched from Milestone 1`);

    const roadmapNode2 = await RoadmapNode.create({
      roadmap: roadmap._id,
      title: 'Build Real Projects',
      description: 'Apply your React skills to build production-ready applications',
      order: 2,
      phase: 'Application',
      milestone: 'Complete 3 portfolio projects',
      nodeType: 'milestone',
      status: 'in-progress'
    });
    console.log(`  ✓ Milestone 2: ${roadmapNode2.title}`);

    const m2Topics = await RoadmapNode.insertMany([
      { roadmap: roadmap._id, title: 'Routing (React Router)', order: 201, parentId: roadmapNode2._id, nodeType: 'topic', status: 'in-progress' },
      { roadmap: roadmap._id, title: 'API Integration', order: 202, parentId: roadmapNode2._id, nodeType: 'topic', status: 'not-started' },
      { roadmap: roadmap._id, title: 'State Management (Redux/Zustand)', order: 203, parentId: roadmapNode2._id, nodeType: 'topic', status: 'not-started' },
      { roadmap: roadmap._id, title: 'Testing (Jest/RTL)', order: 204, parentId: roadmapNode2._id, nodeType: 'optional', status: 'not-started' },
    ]);
    console.log(`    ↳ ${m2Topics.length} sub-topics branched from Milestone 2`);

    const roadmapNode3 = await RoadmapNode.create({
      roadmap: roadmap._id,
      title: 'Advanced Patterns & Job Ready',
      description: 'Learn advanced React patterns and prepare for interviews',
      order: 3,
      phase: 'Mastery',
      milestone: 'Pass technical interviews',
      nodeType: 'milestone',
      status: 'not-started'
    });
    console.log(`  ✓ Milestone 3: ${roadmapNode3.title}`);

    const m3Topics = await RoadmapNode.insertMany([
      { roadmap: roadmap._id, title: 'Performance Optimization', order: 301, parentId: roadmapNode3._id, nodeType: 'topic', status: 'not-started' },
      { roadmap: roadmap._id, title: 'Design Patterns', order: 302, parentId: roadmapNode3._id, nodeType: 'topic', status: 'not-started' },
      { roadmap: roadmap._id, title: 'System Design Basics', order: 303, parentId: roadmapNode3._id, nodeType: 'optional', status: 'not-started' },
      { roadmap: roadmap._id, title: 'Mock Interviews', order: 304, parentId: roadmapNode3._id, nodeType: 'topic', status: 'not-started' },
    ]);
    console.log(`    ↳ ${m3Topics.length} sub-topics branched from Milestone 3`);

    // ====== PHASE 3: FLASHCARDS ======
    console.log('\n🎴 Creating flashcards...');
    const flashcards = [
      {
        front: 'What is React?',
        back: 'React is a declarative, efficient, and flexible JavaScript library for building user interfaces.',
        topic: 'React Basics',
        subject: subject._id
      },
      {
        front: 'What are React components?',
        back: 'Components are small, reusable pieces of code that return a React element to be rendered to the page.',
        topic: 'React Basics',
        subject: subject._id
      },
      {
        front: 'What are props in React?',
        back: 'Props (short for properties) are how we pass data from parent to child components. They are read-only.',
        topic: 'Components',
        subject: subject._id
      },
      {
        front: 'What is the useState hook?',
        back: 'useState is a hook that lets you add state to functional components. It returns an array with the current state value and a function to update it.',
        topic: 'Hooks',
        subject: subject._id
      },
      {
        front: 'What is the useEffect hook used for?',
        back: 'useEffect lets you perform side effects in function components, such as data fetching, subscriptions, or manually changing the DOM.',
        topic: 'Hooks',
        subject: subject._id
      },
      {
        front: 'What are the Rules of Hooks?',
        back: 'Only call hooks at the top level (not in loops/conditions), and only call them from React functions.',
        topic: 'Hooks',
        subject: subject._id
      }
    ];

    for (const flashcardData of flashcards) {
      await Flashcard.create(flashcardData);
    }
    console.log(`  ✓ Created ${flashcards.length} flashcards`);

    // ====== PHASE 3: QUIZ & QUESTIONS ======
    console.log('\n📝 Creating quiz with questions...');
    const quiz = await Quiz.create({
      title: 'React Fundamentals Quiz',
      description: 'Test your understanding of React basics, components, and hooks',
      topic: 'React Basics',
      subject: subject._id,
      difficulty: 'Beginner',
      passingScore: 70
    });
    console.log(`  ✓ Created quiz: ${quiz.title}`);

    const quizQuestions = [
      {
        quiz: quiz._id,
        questionText: 'What does JSX stand for?',
        options: [
          'JavaScript XML',
          'JavaScript Extension',
          'Java Syntax Extension',
          'JavaScript Executable'
        ],
        correctOptionIndex: 0,
        topic: 'React Basics'
      },
      {
        quiz: quiz._id,
        questionText: 'Which hook would you use to manage local state in a functional component?',
        options: [
          'useContext',
          'useEffect',
          'useState',
          'useReducer'
        ],
        correctOptionIndex: 2,
        topic: 'Hooks'
      },
      {
        quiz: quiz._id,
        questionText: 'How do you pass data from a parent component to a child component?',
        options: [
          'Using state',
          'Using props',
          'Using context',
          'Using refs'
        ],
        correctOptionIndex: 1,
        topic: 'Components'
      },
      {
        quiz: quiz._id,
        questionText: 'What is the correct way to update state in React?',
        options: [
          'Directly modify the state variable',
          'Use the setter function provided by useState',
          'Use document.getElementById',
          'Use this.state'
        ],
        correctOptionIndex: 1,
        topic: 'Hooks'
      },
      {
        quiz: quiz._id,
        questionText: 'When does useEffect run by default?',
        options: [
          'Only once when component mounts',
          'After every render',
          'Before every render',
          'Never automatically'
        ],
        correctOptionIndex: 1,
        topic: 'Hooks'
      }
    ];

    for (const questionData of quizQuestions) {
      await QuizQuestion.create(questionData);
    }
    console.log(`  ✓ Created ${quizQuestions.length} questions`);

    // Update quiz with question count
    quiz.questionCount = quizQuestions.length;
    await quiz.save();

    // ====== PHASE 3: ACHIEVEMENT DEFINITIONS ======
    console.log('\n🏆 Creating achievement definitions...');
    const achievements = [
      {
        key: 'first_chapter',
        title: 'First Step',
        description: 'Complete your first chapter',
        icon: '📚',
        criteriaType: 'chapters_completed',
        criteriaValue: 1
      },
      {
        key: 'complete_book',
        title: 'Bookworm',
        description: 'Complete an entire book',
        icon: '📖',
        criteriaType: 'books_completed',
        criteriaValue: 1
      },
      {
        key: 'streak_7',
        title: 'Consistent Learner',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        criteriaType: 'streak_days',
        criteriaValue: 7
      },
      {
        key: 'flashcard_reviews_100',
        title: 'Flashcard Master',
        description: 'Review 100 flashcards',
        icon: '🎴',
        criteriaType: 'flashcard_reviews',
        criteriaValue: 100
      },
      {
        key: 'visit_roadmap',
        title: 'Roadmap Explorer',
        description: 'Start your learning journey (earn any XP)',
        icon: '🗺️',
        criteriaType: 'xp_earned',
        criteriaValue: 1
      },
      {
        key: 'quiz_perfect_5',
        title: 'Quiz Master',
        description: 'Score 90% or higher on 5 quizzes',
        icon: '🎯',
        criteriaType: 'high_score_quizzes',
        criteriaValue: 5
      },
      {
        key: 'complete_learning_path',
        title: 'Finisher',
        description: 'Complete a full learning path',
        icon: '🏁',
        criteriaType: 'learning_paths_completed',
        criteriaValue: 1
      }
    ];

    for (const achievementData of achievements) {
      await Achievement.create(achievementData);
    }
    console.log(`  ✓ Created ${achievements.length} achievement definitions`);

    // ====== PHASE 4: NOTES, BOOKMARKS, ACTIVITY LOGS ======
    console.log('\n📝 Creating Phase 4 personalization data...');
    
    // First, we need to create a demo user (or use an existing one if seeding users separately)
    // For this seed, we'll create a demo user
    const bcrypt = require('bcryptjs');
    let demoUser = await User.findOne({ email: 'demo@academix.com' });
    
    if (!demoUser) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@academix.com',
        password: hashedPassword,
        role: 'admin', // Promoted to admin for Phase 5
        xp: 45,
        currentStreak: 3,
        longestStreak: 7,
        lastActivityDate: new Date()
      });
      console.log(`  ✓ Created demo user (ADMIN): ${demoUser.email}`);
    } else {
      // Promote existing demo user to admin if not already
      if (demoUser.role !== 'admin') {
        demoUser.role = 'admin';
        await demoUser.save();
        console.log(`  ✓ Promoted demo user to admin: ${demoUser.email}`);
      }
    }

    // Create sample notes
    const sampleNotes = [
      {
        userId: demoUser._id,
        contentType: 'chapter',
        contentId: allChapters[0]._id,
        text: 'React is a library, not a framework. This is important because it means React focuses on building UI components and leaves other aspects (routing, state management) to additional libraries.'
      },
      {
        userId: demoUser._id,
        contentType: 'chapter',
        contentId: allChapters[1]._id,
        text: 'Key insight: Props flow down (parent to child) but cannot be modified by the child. For upward communication, pass callback functions as props.'
      },
      {
        userId: demoUser._id,
        contentType: 'chapter',
        contentId: allChapters[2]._id,
        text: 'useState returns an array with two elements: [currentValue, setterFunction]. Always use the setter function to update state, never modify the state variable directly!'
      }
    ];

    for (const noteData of sampleNotes) {
      await Note.create(noteData);
    }
    console.log(`  ✓ Created ${sampleNotes.length} sample notes`);

    // Create sample bookmarks
    const sampleBookmarks = [
      {
        userId: demoUser._id,
        contentType: 'book',
        contentId: book._id
      },
      {
        userId: demoUser._id,
        contentType: 'chapter',
        contentId: allChapters[2]._id
      },
      {
        userId: demoUser._id,
        contentType: 'roadmapNode',
        contentId: roadmapNode1._id
      }
    ];

    for (const bookmarkData of sampleBookmarks) {
      await Bookmark.create(bookmarkData);
    }
    console.log(`  ✓ Created ${sampleBookmarks.length} sample bookmarks`);

    // Create activity logs for last 3 days (to populate calendar)
    const today = new Date();
    const activityLogs = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      activityLogs.push({
        userId: demoUser._id,
        date,
        count: Math.floor(Math.random() * 5) + 3 // 3-7 activities per day
      });
    }

    // Add one more day 7 days ago
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    activityLogs.push({
      userId: demoUser._id,
      date: weekAgo,
      count: 4
    });

    for (const logData of activityLogs) {
      await ActivityLog.create(logData);
    }
    console.log(`  ✓ Created ${activityLogs.length} activity log entries`);

    // ====== PHASE 4: SKILL TREE ======
    console.log('\n🌳 Creating skill tree for Web Development...');
    
    // Layer 0: Foundations
    const skillReactBasics = await SkillNode.create({
      subject: subject._id,
      title: 'React Basics',
      description: 'Understand the core concepts of React including components, JSX, and the virtual DOM',
      prerequisiteSkillNodeIds: [],
      contentType: 'chapter',
      chapter: allChapters[0]._id,
      book: book._id,
      layer: 0,
      order: 1
    });

    // Layer 1: Component Concepts
    const skillComponents = await SkillNode.create({
      subject: subject._id,
      title: 'Component Architecture',
      description: 'Master component composition, props, and reusable component patterns',
      prerequisiteSkillNodeIds: [skillReactBasics._id],
      contentType: 'chapter',
      chapter: allChapters[1]._id,
      book: book._id,
      layer: 1,
      order: 1
    });

    const skillJSX = await SkillNode.create({
      subject: subject._id,
      title: 'JSX Mastery',
      description: 'Deep dive into JSX syntax, expressions, and conditional rendering',
      prerequisiteSkillNodeIds: [skillReactBasics._id],
      contentType: 'none',
      layer: 1,
      order: 2
    });

    // Layer 2: State Management - This node has TWO prerequisites (merge case)
    const skillStateHooks = await SkillNode.create({
      subject: subject._id,
      title: 'State & Hooks',
      description: 'Learn useState, useEffect, and other React hooks for state management',
      prerequisiteSkillNodeIds: [skillComponents._id, skillJSX._id], // MULTIPLE PREREQUISITES
      contentType: 'chapter',
      chapter: allChapters[2]._id,
      book: book._id,
      layer: 2,
      order: 1
    });

    // Layer 3: Advanced Topics (branching from State & Hooks)
    const skillCustomHooks = await SkillNode.create({
      subject: subject._id,
      title: 'Custom Hooks',
      description: 'Create your own reusable hooks to share logic between components',
      prerequisiteSkillNodeIds: [skillStateHooks._id],
      contentType: 'none',
      layer: 3,
      order: 1
    });

    const skillContextAPI = await SkillNode.create({
      subject: subject._id,
      title: 'Context API',
      description: 'Manage global state without prop drilling using React Context',
      prerequisiteSkillNodeIds: [skillStateHooks._id],
      contentType: 'none',
      layer: 3,
      order: 2
    });

    console.log(`  ✓ Created skill tree with 7 nodes (including 1 node with 2 prerequisites)`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Subjects: ${await Subject.countDocuments()}`);
    console.log(`   Books: ${await Book.countDocuments()}`);
    console.log(`   Chapters: ${await Chapter.countDocuments()}`);
    console.log(`   Learning Paths: ${await LearningPath.countDocuments()}`);
    console.log(`   Learning Path Nodes: ${await LearningPathNode.countDocuments()}`);
    console.log(`   Roadmaps: ${await Roadmap.countDocuments()}`);
    console.log(`   Roadmap Nodes: ${await RoadmapNode.countDocuments()}`);
    console.log(`   Flashcards: ${await Flashcard.countDocuments()}`);
    console.log(`   Quizzes: ${await Quiz.countDocuments()}`);
    console.log(`   Quiz Questions: ${await QuizQuestion.countDocuments()}`);
    console.log(`   Achievements: ${await Achievement.countDocuments()}`);
    console.log(`   Notes: ${await Note.countDocuments()}`);
    console.log(`   Bookmarks: ${await Bookmark.countDocuments()}`);
    console.log(`   Activity Logs: ${await ActivityLog.countDocuments()}`);
    console.log(`   Skill Nodes: ${await SkillNode.countDocuments()}`);
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log('\n👤 Demo User Credentials (ADMIN):');
    console.log(`   Email: demo@academix.com`);
    console.log(`   Password: demo123`);
    console.log(`   Role: admin`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
