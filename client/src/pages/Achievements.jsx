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
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Trophies</p>
        <h1 className="pp-title">Achievements</h1>
        <p className="pp-sub">You have unlocked {unlockedCount} out of {totalCount} achievements.</p>
      </div>

      <div className="pp-panel">
        <div className="pp-progress-head">
          <span>Collection progress</span>
          <span>{unlockedCount}/{totalCount}</span>
        </div>
        <div className="pp-progress" style={{ marginBottom: 0 }}>
          <div
            className="pp-progress-fill"
            style={{ width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="pp-grid">
        {achievements.map(achievement => (
          <div
            key={achievement._id}
            className={`pp-card-item ach-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="ach-badge" aria-hidden="true">
              {achievement.isUnlocked ? achievement.icon : '🔒'}
            </div>
            <h3>{achievement.title}</h3>
            <p>{achievement.description}</p>
            <div className="pp-card-actions">
              {achievement.isUnlocked && achievement.unlockedAt ? (
                <span className="pp-tag pp-tag-mint">
                  ✓ {new Date(achievement.unlockedAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="pp-tag pp-tag-grey">Complete criteria to unlock</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Achievements;
