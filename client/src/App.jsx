import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatedNav } from './components/AnimatedNav';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Catalogue from './pages/Catalogue';
import BookReader from './pages/BookReader';
import LearningPaths from './pages/LearningPaths';
import LearningPathDetail from './pages/LearningPathDetail';
import Roadmaps from './pages/Roadmaps';
import RoadmapDetail from './pages/RoadmapDetail';
import FlashcardReview from './pages/FlashcardReview';
import Quizzes from './pages/Quizzes';
import QuizTake from './pages/QuizTake';
import Achievements from './pages/Achievements';
import { isAuthenticated, getUser, logout } from './utils/auth';
import Notes from './pages/Notes';
import Bookmarks from './pages/Bookmarks';
import SkillTree from './pages/SkillTree';
import FocusTimer from './pages/FocusTimer';
import AdminDashboard from './pages/AdminDashboard';
import AdminSubjects from './pages/AdminSubjects';
import AdminBooks from './pages/AdminBooks';
import { RoadmapView } from './pages/RoadmapView';
import { PortfolioView } from './pages/PortfolioView';

// Defined at module level so their identity is stable across renders.
// (Declared inside App they were re-created on every render, which remounted
// the whole page — and refetched its data — each time App's state changed.)
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const currentUser = getUser();
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  // Read the stored user synchronously. Starting at null made pages that
  // receive `user` (e.g. BookReader) crash with `user.id` on a hard refresh.
  const [user, setUser] = useState(() => (isAuthenticated() ? getUser() : null));

  // Keep in sync if the token is cleared elsewhere (e.g. a 401 in axios).
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('learnflow:logout', onLogout);
    return () => window.removeEventListener('learnflow:logout', onLogout);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <BrowserRouter>
      <AnimatedNav onLogout={handleLogout} />
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/catalogue" element={<ProtectedRoute><Catalogue /></ProtectedRoute>} />
        <Route path="/book/:bookId" element={<ProtectedRoute><BookReader user={user} /></ProtectedRoute>} />
        <Route path="/learning-paths" element={<ProtectedRoute><LearningPaths /></ProtectedRoute>} />
        <Route path="/learning-path/:pathId" element={<ProtectedRoute><LearningPathDetail /></ProtectedRoute>} />
        <Route path="/roadmaps" element={<ProtectedRoute><Roadmaps /></ProtectedRoute>} />
        <Route path="/roadmap" element={<RoadmapView />} />
        <Route path="/portfolio" element={<PortfolioView />} />
        <Route path="/roadmap/:roadmapId" element={<ProtectedRoute><RoadmapDetail /></ProtectedRoute>} />
        <Route path="/flashcards" element={<ProtectedRoute><FlashcardReview user={user} /></ProtectedRoute>} />
        <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
        <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizTake /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
        <Route path="/skill-tree/:subjectId" element={<ProtectedRoute><SkillTree /></ProtectedRoute>} />
        <Route path="/focus" element={<ProtectedRoute><FocusTimer /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/subjects" element={<AdminRoute><AdminSubjects /></AdminRoute>} />
        <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;
