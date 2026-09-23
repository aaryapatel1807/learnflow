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
    <div className="admin-page">
      <div className="admin-header-stripe">
        <div className="container admin-header-content">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="subtitle">Platform Overview & Statistics</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to App</button>
        </div>
      </div>

      <div className="container">
        <section className="admin-stats-section">
          <h2>Users & Engagement</h2>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">👤</div>
              <div>
                <div className="admin-stat-value">{stats.users.total}</div>
                <div className="admin-stat-label">Total Users</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ color: 'var(--color-verdigris-600)' }}>✨</div>
              <div>
                <div className="admin-stat-value">{stats.users.activeLast7Days}</div>
                <div className="admin-stat-label">Active (7d)</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">📈</div>
              <div>
                <div className="admin-stat-value">{stats.engagement.recentActivityLast30Days}</div>
                <div className="admin-stat-label">Activities (30d)</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">🎉</div>
              <div>
                <div className="admin-stat-value">{stats.engagement.averageCompletionRate}</div>
                <div className="admin-stat-label">Completion Rate</div>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-stats-section">
          <h2>Content Inventory</h2>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">📂</div>
              <div><div className="admin-stat-value">{stats.content.subjects}</div><div className="admin-stat-label">Subjects</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">📖</div>
              <div><div className="admin-stat-value">{stats.content.books}</div><div className="admin-stat-label">Books</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">📄</div>
              <div><div className="admin-stat-value">{stats.content.chapters}</div><div className="admin-stat-label">Chapters</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">🎯</div>
              <div><div className="admin-stat-value">{stats.content.learningPaths}</div><div className="admin-stat-label">Paths</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon">❓</div>
              <div><div className="admin-stat-value">{stats.content.quizzes}</div><div className="admin-stat-label">Quizzes</div></div>
            </div>
          </div>
        </section>

        <section className="admin-stats-section">
          <h2>Popular Subjects</h2>
          <div className="admin-chart-container">
            {stats.popularSubjects.length > 0 ? (
              stats.popularSubjects.map((subject, index) => (
                <div key={subject.id} className="admin-bar-item">
                  <div className="admin-bar-label">{subject.name}</div>
                  <div className="admin-bar-wrapper">
                    <div
                      className="admin-bar-fill"
                      style={{
                        width: `${Math.max(5, (subject.count / maxCount) * 100)}%`,
                        backgroundColor: index % 2 === 0 ? 'var(--color-ember-500)' : 'var(--color-verdigris-500)'
                      }}
                    >
                      {subject.count}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No subject data yet</p>
            )}
          </div>
        </section>

        <section className="admin-stats-section">
          <h2>Quick Actions</h2>
          <div className="admin-quick-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/admin/subjects')}>📂 Manage Subjects</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/books')}>📖 Manage Books</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/learning-paths')}>🎯 Manage Paths</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/roadmaps')}>🗺️ Manage Roadmaps</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/quizzes')}>❓ Manage Quizzes</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/flashcards')}>🃏 Manage Flashcards</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
