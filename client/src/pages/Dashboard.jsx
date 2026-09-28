import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

/* Minimal line icons (stroke = currentColor) */
const I = (path) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);
const ICONS = {
  star: I(<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />),
  flame: I(<path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-2-5.3-3.7-7C14.2 6.1 13 4.5 13 2.5c-3 2-4.5 4.2-5.4 6.5-.6-1-.9-2.1-1-3.5C4.9 7 4.5 9.4 4.5 11.5 4.5 18 7.6 22 12 22z" />),
  trophy: I(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 2 4.5 4.5 4.5M17 6h3a1 1 0 0 1 1 1c0 2.5-2 4.5-4.5 4.5" /></>),
  cards: I(<><rect x="3" y="5" width="13" height="14" rx="2" /><path d="M8 5V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1" /></>),
  quiz: I(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0M9 13l1.2 1.2L13 11M9 17.5h6" /></>),
  path: I(<><circle cx="6" cy="19" r="2.2" /><circle cx="18" cy="5" r="2.2" /><path d="M8.2 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" /></>),
  map: I(<><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>),
  book: I(<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zm0 0v14" />),
};

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

  if (!user) return null;

  /* Greeting */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user.name || '').split(' ')[0];
  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  /* Last 7 days of activity for the bar chart */
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return {
      key,
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      count: activityData[key] || 0,
    };
  });
  const maxCount = Math.max(1, ...weekDays.map(d => d.count));
  const maxIdx = weekDays.findIndex(d => d.count === maxCount && maxCount > 0);
  const weekTotal = weekDays.reduce((s, d) => s + d.count, 0);

  const quickLinks = [
    { to: '/flashcards',     label: 'Flashcards',     tint: 'tint-steel',  icon: ICONS.cards },
    { to: '/quizzes',        label: 'Quizzes',        tint: 'tint-navy',   icon: ICONS.quiz },
    { to: '/achievements',   label: 'Achievements',   tint: 'tint-amber',  icon: ICONS.trophy },
    { to: '/learning-paths', label: 'Learning Paths', tint: 'tint-sky',    icon: ICONS.path },
    { to: '/roadmaps',       label: 'Roadmaps',       tint: 'tint-teal',   icon: ICONS.map },
    { to: '/catalogue',      label: 'Catalogue',      tint: 'tint-slate',  icon: ICONS.book },
  ];

  /* Milestone — shown when meaningful XP is accumulated */
  const showMilestone = userStats.xp >= 100;
  const milestoneCopy =
    userStats.xp >= 500
      ? { label: 'Milestone', title: `${userStats.xp} XP earned`, desc: `You've crossed ${Math.floor(userStats.xp / 100) * 100} XP — top tier of active learners.` }
      : { label: 'Keep going', title: `Level ${level} · ${Math.round((userStats.xp % 100))}% to next`, desc: `You're on a ${userStats.currentStreak}-day streak. Small steps daily.` };

  const upNextTarget = recommendation?.book
    ? `/book/${recommendation.book._id}`
    : `/learning-path/${recommendation?.learningPath._id}`;

  return (
    <div className="container dashboard-page pastel-page">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="pastel-head animate-rise">
        <p className="pastel-eyebrow">{todayStr}</p>
        <h1 className="pastel-title">{greeting}, {firstName}.</h1>
      </header>

      {/* ── GRADIENT STAT CARDS ─────────────────────────────────── */}
      <div className="pastel-cards animate-rise" data-delay="1">
        <div className="pastel-card pc-navy">
          <span className="pc-badge">{ICONS.star}</span>
          <span className="pc-label">Level {level}</span>
          <span className="pc-value">{userStats.xp.toLocaleString()} <small>XP</small></span>
        </div>
        <div className="pastel-card pc-steel">
          <span className="pc-badge">{ICONS.flame}</span>
          <span className="pc-label">Day streak</span>
          <span className="pc-value">{userStats.currentStreak} <small>days</small></span>
        </div>
        <div className="pastel-card pc-teal">
          <span className="pc-badge">{ICONS.trophy}</span>
          <span className="pc-label">Best streak</span>
          <span className="pc-value">{userStats.longestStreak} <small>days</small></span>
        </div>
      </div>

      {/* ── ACTIVITY + UP NEXT ──────────────────────────────────── */}
      <div className="pastel-grid animate-rise" data-delay="2">
        <section className="pastel-panel pastel-activity">
          <div className="pastel-panel-head">
            <h2>Weekly activity</h2>
            <span className="pastel-count">{weekTotal} XP this week</span>
          </div>
          <div className="pastel-bars">
            {weekDays.map((d, i) => (
              <div className="pastel-bar-col" key={d.key}>
                {i === maxIdx && (
                  <span className="pastel-tip">{d.count} XP</span>
                )}
                <div className="pastel-bar-track">
                  <div
                    className="pastel-bar"
                    style={{ height: `${Math.max(7, (d.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="pastel-bar-day">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pastel-panel">
          <div className="pastel-panel-head">
            <h2>Up next</h2>
            {recommendation && <span className="pastel-tag">For you</span>}
          </div>
          {!loadingRecommendation && recommendation ? (
            <div className="pastel-next">
              <h3 className="pastel-next-title">{recommendation.title}</h3>
              {recommendation.description && (
                <p className="pastel-meta">{recommendation.description}</p>
              )}
              <p className="pastel-meta">
                {recommendation.learningPath.title}
                {recommendation.chapter && ` · Ch ${recommendation.chapter.chapterNumber}`}
              </p>
              <Link to={upNextTarget}>
                <span className="pastel-btn">Start learning</span>
              </Link>
            </div>
          ) : (
            <div className="pastel-next">
              {loading ? (
                <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
              ) : nextNode ? (
                <>
                  <h3 className="pastel-next-title">{nextNode.title}</h3>
                  {nextNode.description && <p className="pastel-meta">{nextNode.description}</p>}
                  <div className="pastel-next-actions">
                    {nextNode.book && (
                      <Link to={`/book/${nextNode.book._id}`}>
                        <span className="pastel-btn">Start learning</span>
                      </Link>
                    )}
                    <Link to={`/learning-path/${activeLearningPath?._id}`}>
                      <span className="pastel-btn pastel-btn-ghost">View full path</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="no-progress">
                  <p>No active learning path yet.</p>
                  <Link to="/learning-paths">
                    <span className="pastel-btn">Browse learning paths</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── QUICK LINKS ─────────────────────────────────────────── */}
      <div className="pastel-grid pastel-grid-2 animate-rise" data-delay="3">
        <section className="pastel-panel">
          <div className="pastel-panel-head">
            <h2>Quick links</h2>
          </div>
          <div className="pastel-links">
            {quickLinks.map(({ to, label, tint, icon }) => (
              <Link key={to} to={to} className="pastel-link">
                <span className={`pastel-chip ${tint}`}>{icon}</span>
                <span>{label}</span>
                <span className="pastel-chev" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </section>

        {showMilestone && (
          <section className="pastel-panel pastel-milestone">
            <span className="pastel-milestone-dot" aria-hidden="true" />
            <p className="pastel-eyebrow">{milestoneCopy.label}</p>
            <h2>{milestoneCopy.title}</h2>
            <p className="pastel-meta">{milestoneCopy.desc}</p>
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
