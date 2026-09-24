import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

function Dashboard({ user }) {
  const [nextNode, setNextNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLearningPath, setActiveLearningPath] = useState(null);
  const [userStats, setUserStats] = useState({ xp: 0, currentStreak: 0, longestStreak: 0 });
  const [activityData, setActivityData] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const userResponse = await api.get(`/users/${user.id}`);
        setUserStats({
          xp: userResponse.data.xp || 0,
          currentStreak: userResponse.data.currentStreak || 0,
          longestStreak: userResponse.data.longestStreak || 0,
        });

        const calendarResponse = await api.get(`/calendar/${user.id}`);
        setActivityData(calendarResponse.data);

        try {
          const recommendationResponse = await api.get(`/recommendations/${user.id}`);
          setRecommendation(recommendationResponse.data.recommendation);
        } catch (error) {
          console.error('Error fetching recommendation:', error);
        } finally {
          setLoadingRecommendation(false);
        }

        const pathsResponse = await api.get('/learning-paths');
        const paths = pathsResponse.data;
        if (paths.length === 0) { setLoading(false); return; }

        const activePath = paths[0];
        setActiveLearningPath(activePath);

        const pathDetailResponse = await api.get(`/learning-paths/${activePath._id}?userId=${user.id}`);
        const pathWithNodes = pathDetailResponse.data;
        const nextUnlockedNode = pathWithNodes.nodes?.find(
          node => !node.isLocked && !node.isComplete
        );
        if (nextUnlockedNode) setNextNode(nextUnlockedNode);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const level = Math.floor(userStats.xp / 100) + 1;
  const xpInCurrentLevel = userStats.xp % 100;
  const xpForNextLevel = 100;
  const xpPercent = Math.round((xpInCurrentLevel / xpForNextLevel) * 100);

  const generateCalendarGrid = () => {
    const today = new Date();
    const days = [];
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = activityData[dateStr] || 0;
      days.push({ date: dateStr, count, dayOfWeek: date.getDay() });
    }
    return days;
  };

  const getActivityLevel = (count) => {
    if (count === 0) return 'none';
    if (count <= 2) return 'low';
    if (count <= 5) return 'medium';
    if (count <= 10) return 'high';
    return 'very-high';
  };

  if (!user) return null;

  const quickLinks = [
    { to: '/flashcards',     label: 'Flashcards',     icon: '🎴' },
    { to: '/quizzes',        label: 'Quizzes',         icon: '📝' },
    { to: '/achievements',   label: 'Achievements',    icon: '🏆' },
    { to: '/learning-paths', label: 'Learning Paths',  icon: '🗺️' },
    { to: '/roadmaps',       label: 'Roadmaps',        icon: '🎯' },
    { to: '/catalogue',      label: 'Catalogue',       icon: '📚' },
  ];

  // Milestone signal — shown when meaningful XP is accumulated
  const showMilestone = userStats.xp >= 100;
  const milestoneCopy =
    userStats.xp >= 500
      ? { icon: '🌟', label: 'Scholar Milestone', title: `${userStats.xp} XP Earned!`, desc: `You've crossed ${Math.floor(userStats.xp / 100) * 100} XP — you're in the top tier of active learners.` }
      : { icon: '🔥', label: 'Learning Streak', title: `Level ${level} Scholar`, desc: `${xpPercent}% to your next level. Keep pushing — you're on a ${userStats.currentStreak}-day streak!` };

  return (
    <div className="container dashboard-page scholar-shell">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className="hero-banner animate-rise">
        <div className="hero-left">
          <span className="hero-greeting label-xs">Welcome back</span>
          <h1 className="hero-name">{user.name}</h1>
        </div>
        <div className="hero-right">
          <div>
            <div className="hero-level-display">{level}</div>
            <div className="hero-level-label">LEVEL</div>
          </div>
          <div className="hero-xp-section">
            <div className="hero-xp-bar">
              <div
                className="hero-xp-fill"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="hero-xp-text">{xpInCurrentLevel} / {xpForNextLevel} XP to next level</span>
          </div>
        </div>
      </div>

      {/* ── SCHOLAR RAIL ─────────────────────────────────────────── */}
      <div className="scholar-rail-section animate-rise" data-delay="1">
        <div className="scholar-rail">
          <span className="xp-chip">💎 {userStats.xp} XP</span>
          <span className="rail-divider" />
          <span className="scholar-chip chip-ember">🔥 {userStats.currentStreak}-day streak</span>
          <span className="rail-divider" />
          <span className="scholar-chip">⭐ Level {level}</span>
          {userStats.longestStreak > 0 && (
            <>
              <span className="rail-divider" />
              <span className="scholar-chip label-xs">Best: {userStats.longestStreak}d</span>
            </>
          )}
        </div>
      </div>

      {/* ── ACTIVITY CALENDAR ─────────────────────────────────────── */}
      <div className="learning-calendar animate-rise" data-delay="2">
        <h2>Learning Activity</h2>
        <div className="calendar-container">
          <div className="calendar-grid">
            {generateCalendarGrid().map((day, index) => (
              <div
                key={index}
                className={`calendar-day activity-${getActivityLevel(day.count)}`}
                title={`${day.date}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
              />
            ))}
          </div>
          <div className="calendar-legend">
            <span className="legend-label">Less</span>
            <div className="calendar-day activity-none" />
            <div className="calendar-day activity-low" />
            <div className="calendar-day activity-medium" />
            <div className="calendar-day activity-high" />
            <div className="calendar-day activity-very-high" />
            <span className="legend-label">More</span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────── */}
      <div className="dashboard-grid animate-rise" data-delay="3">

        {/* Recommendation — glass-strong hero */}
        {/* Up Next Section */}
        {!loadingRecommendation && recommendation ? (
          <div className="recommendation-card">
            <div className="recommendation-header">
              <h2>Up Next</h2>
              <span className="scholar-chip chip-ember recommendation-badge" style={{ marginLeft: 'auto', marginBottom: 'auto' }}>✨ Personalised</span>
            </div>
            <div className="recommendation-content">
              <h3>{recommendation.title}</h3>
              {recommendation.description && (
                <p className="recommendation-description">{recommendation.description}</p>
              )}
              <div className="recommendation-details surface-elevated">
                <div className="detail-item">
                  <span className="detail-label">Learning path</span>
                  <span className="detail-value">{recommendation.learningPath.title}</span>
                </div>
                {recommendation.book && (
                  <div className="detail-item">
                    <span className="detail-label">Book</span>
                    <span className="detail-value">{recommendation.book.title}</span>
                  </div>
                )}
                {recommendation.chapter && (
                  <div className="detail-item">
                    <span className="detail-label">Chapter</span>
                    <span className="detail-value">
                      {recommendation.chapter.chapterNumber}. {recommendation.chapter.title}
                    </span>
                  </div>
                )}
                <div className="prerequisite-status">
                  <span className="status-badge status-ready">✓ Prerequisites met</span>
                </div>
              </div>
              {recommendation.book ? (
                <Link to={`/book/${recommendation.book._id}`}>
                  <button className="btn btn-primary btn-large press">Start learning →</button>
                </Link>
              ) : (
                <Link to={`/learning-path/${recommendation.learningPath._id}`}>
                  <button className="btn btn-primary btn-large press">View learning path →</button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="continue-card">
            <h2>Up Next</h2>
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>Loading your path…</span>
              </div>
            ) : nextNode ? (
              <div className="next-node">
                <div className="path-indicator">
                  <span>📚</span>
                  <span className="path-name">{activeLearningPath?.title}</span>
                </div>
                <h3>Next: {nextNode.title}</h3>
                {nextNode.description && (
                  <p className="node-description">{nextNode.description}</p>
                )}
                {nextNode.book && (
                  <div className="node-content-info">
                    <p><strong>Book:</strong> {nextNode.book.title}</p>
                    {nextNode.chapter && (
                      <p><strong>Chapter:</strong> {nextNode.chapter.title}</p>
                    )}
                  </div>
                )}
                <div className="node-actions" style={{ flexDirection: 'column' }}>
                  {nextNode.book && (
                    <Link to={`/book/${nextNode.book._id}`}>
                      <button className="btn btn-primary btn-large press">Start learning →</button>
                    </Link>
                  )}
                  <Link to={`/learning-path/${activeLearningPath?._id}`}>
                    <button className="btn btn-secondary btn-large press">View full path</button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="no-progress">
                <p>No active learning path yet.</p>
                <Link to="/learning-paths">
                  <button className="btn btn-primary btn-large press">Browse learning paths →</button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Links — glass surface */}
        <div className="quick-links-card">
          <h2>Quick Links</h2>
          <div className="quick-links">
            {quickLinks.map(({ to, label, icon }) => (
              <Link key={to} to={to} className="quick-link-btn press">
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONCEPT SIGNAL ────────────────────────────────────────── */}
      {showMilestone && (
        <div className="dashboard-signal-section animate-rise" data-delay="4">
          <div className="concept-signal">
            <span className="signal-icon">{milestoneCopy.icon}</span>
            <div className="signal-body">
              <div className="signal-label">{milestoneCopy.label}</div>
              <div className="signal-title">{milestoneCopy.title}</div>
              <div className="signal-description">{milestoneCopy.desc}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
