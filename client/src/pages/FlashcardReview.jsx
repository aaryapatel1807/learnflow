import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './FlashcardReview.css';

const GRADES = [
  { key: '1', rating: 'Again', cls: 'fc-again', hint: 'Forgot it — see it tomorrow' },
  { key: '2', rating: 'Hard', cls: 'fc-hard', hint: 'Recalled with effort' },
  { key: '3', rating: 'Good', cls: 'fc-good', hint: 'Recalled comfortably' },
  { key: '4', rating: 'Easy', cls: 'fc-easy', hint: 'Too easy — push it far out' },
];

function intervalLabel(days) {
  if (days <= 1) return 'tomorrow';
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? 'in ~1 month' : `in ~${months} months`;
}

function FlashcardReview() {
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [lastInterval, setLastInterval] = useState(null);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, xp: 0 });
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => { fetchDueCards(); }, []);

  const fetchDueCards = async () => {
    try {
      const response = await api.get(`/flashcards/due?userId=${user.id}`);
      setDueCards(response.data);
    } catch (error) {
      console.error('Error fetching due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = useCallback(async (rating) => {
    if (reviewing || done) return;
    setReviewing(true);
    try {
      const currentCard = dueCards[currentIndex];
      const res = await api.post('/flashcards/review', { userId: user.id, flashcardId: currentCard._id, rating });
      setLastInterval(res.data.nextReviewInDays ?? null);
      const newStats = {
        reviewed: stats.reviewed + 1,
        xp: stats.xp + (res.data.xpEarned || 0),
      };
      setStats(newStats);
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        setDone(true);
      }
    } catch (error) {
      console.error('Error recording review:', error);
    } finally {
      setReviewing(false);
    }
  }, [reviewing, done, dueCards, currentIndex, user.id, stats]);

  const toggleFlip = useCallback(() => setFlipped((f) => !f), []);

  // Keyboard shortcuts: Space/Enter flips, 1–4 grades (Anki-style).
  useEffect(() => {
    const onKey = (e) => {
      if (done || loading) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) toggleFlip();
        return;
      }
      const grade = GRADES.find((g) => g.key === e.key);
      if (grade && flipped) handleReview(grade.rating);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, loading, flipped, toggleFlip, handleReview]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading flashcards…</span></div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container">
        <div className="pp-panel" style={{ textAlign: 'center', marginTop: '32px' }}>
          <p className="pp-eyebrow">Session complete</p>
          <h1 className="pp-title">Nice work! 🎉</h1>
          <div className="pp-cards" style={{ marginTop: '18px' }}>
            <div className="pp-card pp-mint">
              <span className="pp-card-label">Cards reviewed</span>
              <span className="pp-card-value">{stats.reviewed}</span>
            </div>
            <div className="pp-card pp-violet">
              <span className="pp-card-label">XP earned</span>
              <span className="pp-card-value">💎 +{stats.xp}</span>
            </div>
          </div>
          <div className="qt-actions" style={{ marginTop: '20px' }}>
            <button onClick={() => navigate('/')} className="btn btn-primary">Dashboard</button>
            <button onClick={() => navigate('/quizzes')} className="btn btn-secondary">Take a quiz</button>
          </div>
        </div>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="container">
        <div className="pp-hero" style={{ textAlign: 'center' }}>
          <p className="pp-eyebrow">Flashcards</p>
          <h1 className="pp-title">All caught up! 🎉</h1>
          <p className="pp-sub" style={{ margin: '8px auto 0' }}>No cards due right now. Check back later for more reviews.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '18px' }}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <div className="container fc-review">
      <div className="pp-panel fc-head">
        <div>
          <p className="pp-eyebrow" style={{ marginBottom: '4px' }}>Flashcards</p>
          <h1 className="pp-title">Review Session</h1>
        </div>
        <span className="pp-tag">{currentIndex + 1} / {dueCards.length}</span>
      </div>

      <div className="pp-progress" style={{ marginBottom: '26px' }}>
        <div className="pp-progress-fill" style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }} />
      </div>

      {/* Flashcard — 3D flip is the signature motion moment */}
      <div className="fc-stage">
        <div
          className={`fc-card ${flipped ? 'flipped' : ''}`}
          onClick={toggleFlip}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Card answer. Click to flip back.' : 'Card question. Click to reveal answer.'}
          onKeyDown={(e) => e.key === 'Enter' && toggleFlip()}
        >
          <div className="fc-face fc-front">
            {currentCard.topic && <div className="pp-tag pp-tag-coral fc-topic">{currentCard.topic}</div>}
            <div className="fc-text">{currentCard.front}</div>
            <div className="fc-hint">Click or press Space to reveal answer</div>
          </div>
          <div className="fc-face fc-back">
            {currentCard.topic && <div className="pp-tag fc-topic">{currentCard.topic}</div>}
            <div className="fc-text">{currentCard.back}</div>
          </div>
        </div>
      </div>

      {flipped ? (
        <>
          <div className="fc-buttons">
            {GRADES.map((g) => (
              <button
                key={g.rating}
                onClick={() => handleReview(g.rating)}
                className={`btn ${g.cls}`}
                disabled={reviewing}
                title={`${g.hint} (press ${g.key})`}
              >
                {g.rating}<kbd>{g.key}</kbd>
              </button>
            ))}
          </div>
          {lastInterval !== null && currentIndex > 0 && (
            <p className="fc-interval-note" role="status">
              Previous card scheduled {intervalLabel(lastInterval)} · SM-2 spaced repetition
            </p>
          )}
        </>
      ) : (
        <p className="fc-hint-text">Review the question, then click the card (or press Space) to reveal the answer.</p>
      )}

      <p className="pp-count" style={{ textAlign: 'center', marginTop: '14px' }}>
        Reviews recorded: {currentCard.reviewInfo?.reviewCount || 0}
        {currentCard.reviewInfo?.interval > 0 && ` · current interval ${currentCard.reviewInfo.interval}d`}
      </p>
    </div>
  );
}

export default FlashcardReview;
