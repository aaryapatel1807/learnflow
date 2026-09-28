import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Failed to fetch dashboard stats');
      setStats(data.stats);
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container admin-page"><div className="loading-state"><div className="spinner" /><span>Loading dashboard…</span></div></div>;
  if (error) return <div className="container admin-page"><div className="error-message">⚠️ {error}</div></div>;
  if (!stats) return <div className="container admin-page"><div className="error-message">No data available</div></div>;

  const maxCount = stats.popularSubjects.length > 0 ? Math.max(...stats.popularSubjects.map(s => s.count)) : 0;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Admin</p>
        <h1 className="pp-title">Admin Dashboard</h1>
        <p className="pp-sub">Platform overview & statistics.</p>
      </div>

      <div className="pp-toolbar" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>Back to App</button>
      </div>

      <h2 className="pp-section-title">Users & Engagement</h2>
      <div className="pp-cards pp-cards-4">
        <div className="pp-card pp-coral">
          <span className="pp-card-label">Total Users</span>
          <span className="pp-card-value">👤 {stats.users.total}</span>
        </div>
        <div className="pp-card pp-mint">
          <span className="pp-card-label">Active (7d)</span>
          <span className="pp-card-value">✨ {stats.users.activeLast7Days}</span>
        </div>
        <div className="pp-card pp-blue">
          <span className="pp-card-label">Activities (30d)</span>
          <span className="pp-card-value">📈 {stats.engagement.recentActivityLast30Days}</span>
        </div>
        <div className="pp-card pp-violet">
          <span className="pp-card-label">Completion Rate</span>
          <span className="pp-card-value">🎉 {stats.engagement.averageCompletionRate}</span>
        </div>
      </div>

      <h2 className="pp-section-title">Content Inventory</h2>
      <div className="pp-cards pp-cards-5">
        <div className="pp-card pp-violet"><span className="pp-card-label">Subjects</span><span className="pp-card-value">📂 {stats.content.subjects}</span></div>
        <div className="pp-card pp-coral"><span className="pp-card-label">Books</span><span className="pp-card-value">📖 {stats.content.books}</span></div>
        <div className="pp-card pp-blue"><span className="pp-card-label">Chapters</span><span className="pp-card-value">📄 {stats.content.chapters}</span></div>
        <div className="pp-card pp-mint"><span className="pp-card-label">Paths</span><span className="pp-card-value">🎯 {stats.content.learningPaths}</span></div>
        <div className="pp-card pp-coral"><span className="pp-card-label">Quizzes</span><span className="pp-card-value">❓ {stats.content.quizzes}</span></div>
      </div>

      <div className="pp-panel">
        <h2>Popular Subjects</h2>
        <div className="adm-bars">
          {stats.popularSubjects.length > 0 ? (
            stats.popularSubjects.map((subject, index) => (
              <div key={subject.id} className="adm-bar-row">
                <div className="adm-bar-label">{subject.name}</div>
                <div className="pp-progress" style={{ flex: 1 }}>
                  <div
                    className="pp-progress-fill"
                    style={{ width: `${Math.max(5, (subject.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="pp-count" style={{ minWidth: '40px', textAlign: 'right' }}>{subject.count}</span>
              </div>
            ))
          ) : (
            <p className="pp-count">No subject data yet</p>
          )}
        </div>
      </div>

      <div className="pp-panel">
        <h2>Quick Actions</h2>
        <div className="pp-toolbar" style={{ marginTop: '14px', marginBottom: 0 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/subjects')}>📂 Manage Subjects</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/books')}>📖 Manage Books</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/learning-paths')}>🎯 Manage Paths</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/roadmaps')}>🗺️ Manage Roadmaps</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/quizzes')}>❓ Manage Quizzes</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/flashcards')}>🃏 Manage Flashcards</button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
