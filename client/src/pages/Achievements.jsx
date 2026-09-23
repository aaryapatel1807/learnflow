import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './Achievements.css';

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await api.get(`/achievements/${user.id}`);
        setAchievements(response.data);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, [user.id]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading achievements…</span></div>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="container achievements-page">
      <h1>Achievements</h1>

      {/* Summary — Level 2 Lifted */}
      <div className="achievements-summary">
        <div className="summary-text">
          <p>You have unlocked</p>
          <p>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
              {unlockedCount}
            </strong>
            {' '}out of{' '}
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
              {totalCount}
            </strong>
            {' '}achievements
          </p>
          <div className="progress-bar" style={{ marginTop: 'var(--space-3)' }}>
            <div
              className="progress-fill"
              style={{ width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <span className="summary-fraction" aria-hidden="true">
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {/* Badge grid — octagonal shape, NOT rounded cards */}
      <div className="achievements-grid">
        {achievements.map(achievement => (
          <div
            key={achievement._id}
            className={`achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="achievement-badge-shape" aria-hidden="true">
              {achievement.isUnlocked ? achievement.icon : '🔒'}
            </div>
            <h3>{achievement.title}</h3>
            <p className="achievement-description">{achievement.description}</p>
            {achievement.isUnlocked && achievement.unlockedAt && (
              <p className="unlock-date">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
            {!achievement.isUnlocked && (
              <p className="locked-message">Complete criteria to unlock</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Achievements;
