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
        navigate('/dashboard');
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
      <div className="container flashcard-empty">
        <h1>All caught up!</h1>
        <p>No cards due right now. Check back later for more reviews.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Back to dashboard
        </button>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <div className="container flashcard-review">
      <div className="review-header">
        <h1>Flashcard Review</h1>
        <span className="review-progress">{currentIndex + 1} / {dueCards.length}</span>
      </div>

      {/* Flashcard — Level 3, 3D flip is the signature motion moment */}
      <div className="flashcard-container">
        <div
          className={`flashcard ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(!flipped)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Card answer. Click to flip back.' : 'Card question. Click to reveal answer.'}
          onKeyDown={(e) => e.key === 'Enter' && setFlipped(!flipped)}
        >
          <div className="flashcard-front">
            {currentCard.topic && <div className="card-topic">{currentCard.topic}</div>}
            <div className="card-content">{currentCard.front}</div>
            <div className="card-hint">Click to reveal answer</div>
          </div>
          <div className="flashcard-back">
            {currentCard.topic && <div className="card-topic">{currentCard.topic}</div>}
            <div className="card-content">{currentCard.back}</div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="review-buttons">
          <button onClick={() => handleReview('Again')} className="btn-review btn-again" disabled={reviewing}>Again</button>
          <button onClick={() => handleReview('Hard')}  className="btn-review btn-hard"  disabled={reviewing}>Hard</button>
          <button onClick={() => handleReview('Good')}  className="btn-review btn-good"  disabled={reviewing}>Good</button>
          <button onClick={() => handleReview('Easy')}  className="btn-review btn-easy"  disabled={reviewing}>Easy</button>
        </div>
      ) : (
        <p className="review-hint">Review the question, then click the card to reveal the answer.</p>
      )}

      <p className="review-stats">Reviews recorded: {currentCard.reviewInfo?.reviewCount || 0}</p>
    </div>
  );
}

export default FlashcardReview;
