import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './FlashcardReview.css';

function FlashcardReview() {
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
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

  const handleReview = async (rating) => {
    if (reviewing) return;
    setReviewing(true);
    try {
      const currentCard = dueCards[currentIndex];
      await api.post('/flashcards/review', { userId: user.id, flashcardId: currentCard._id, rating });
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error recording review:', error);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading flashcards…</span></div>
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
          onClick={() => setFlipped(!flipped)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Card answer. Click to flip back.' : 'Card question. Click to reveal answer.'}
          onKeyDown={(e) => e.key === 'Enter' && setFlipped(!flipped)}
        >
          <div className="fc-face fc-front">
            {currentCard.topic && <div className="pp-tag pp-tag-coral fc-topic">{currentCard.topic}</div>}
            <div className="fc-text">{currentCard.front}</div>
            <div className="fc-hint">Click to reveal answer</div>
          </div>
          <div className="fc-face fc-back">
            {currentCard.topic && <div className="pp-tag fc-topic">{currentCard.topic}</div>}
            <div className="fc-text">{currentCard.back}</div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="fc-buttons">
          <button onClick={() => handleReview('Again')} className="btn fc-again" disabled={reviewing}>Again</button>
          <button onClick={() => handleReview('Hard')}  className="btn fc-hard"  disabled={reviewing}>Hard</button>
          <button onClick={() => handleReview('Good')}  className="btn fc-good"  disabled={reviewing}>Good</button>
          <button onClick={() => handleReview('Easy')}  className="btn fc-easy"  disabled={reviewing}>Easy</button>
        </div>
      ) : (
        <p className="fc-hint-text">Review the question, then click the card to reveal the answer.</p>
      )}

      <p className="pp-count" style={{ textAlign: 'center', marginTop: '14px' }}>
        Reviews recorded: {currentCard.reviewInfo?.reviewCount || 0}
      </p>
    </div>
  );
}

export default FlashcardReview;
