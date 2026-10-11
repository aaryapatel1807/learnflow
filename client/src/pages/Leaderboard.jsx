import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './Leaderboard.css';

const MEDALS = ['🥇', '🥈', '🥉'];

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const myId = user?.id || user?._id;

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await api.get('/leaderboard/weekly');
        setLeaders(res.data.leaders || []);
        setMe(res.data.me || null);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading leaderboard…</span></div>
      </div>
    );
  }

  const renderRow = (entry) => {
    const isMe = String(entry.userId) === String(myId);
    return (
      <div key={entry.userId} className={`pp-card-item lb-row${isMe ? ' lb-me' : ''}`}>
        <span className="lb-rank" aria-label={`Rank ${entry.rank}`}>
          {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
        </span>
        <span className="lb-avatar" aria-hidden="true">
          {(entry.name || 'L').charAt(0).toUpperCase()}
        </span>
        <span className="lb-name">
          {entry.name}
          {isMe && <span className="pp-tag pp-tag-mint lb-you">you</span>}
        </span>
        <span className="lb-xp">{entry.xp} XP</span>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Competition</p>
        <h1 className="pp-title">Weekly Leaderboard</h1>
        <p className="pp-sub">XP earned since Monday — focus sessions and quizzes.</p>
      </div>

      {leaders.length === 0 ? (
        <div className="pp-panel">
          <div className="pp-empty">
            <p>No XP earned yet this week. Start a focus session or take a quiz to get on the board!</p>
          </div>
        </div>
      ) : (
        <div className="pp-panel lb-list">
          <div className="pp-section-head" style={{ marginBottom: 'var(--space-2)' }}>
            <h2 className="pp-section-title">Top learners</h2>
            <span className="pp-count">{leaders.length} ranked</span>
          </div>
          {leaders.map(renderRow)}
        </div>
      )}

      {me && me.rank !== null && me.rank > 20 && (
        <div className="pp-panel lb-list" style={{ marginTop: 'var(--space-3)' }}>
          <div className="pp-section-head" style={{ marginBottom: 'var(--space-2)' }}>
            <h2 className="pp-section-title">Your position</h2>
          </div>
          {renderRow(me)}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
