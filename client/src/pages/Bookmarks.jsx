import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './Bookmarks.css';

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState({
    book: [],
    chapter: [],
    topic: [],
    flashcard: [],
    roadmapNode: [],
    resource: []
  });
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await api.get(`/bookmarks/${user.id}`);
      setBookmarks(response.data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (e, bookmarkId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Remove this bookmark?')) return;
    try {
      await api.delete(`/bookmarks/${bookmarkId}`);
      fetchBookmarks();
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading-state"><div className="spinner" /><span>Loading bookmarks…</span></div></div>;
  }

  const totalBookmarks = Object.values(bookmarks).reduce((sum, arr) => sum + arr.length, 0);

  if (totalBookmarks === 0) {
    return (
      <div className="container">
        <div className="pp-hero">
          <p className="pp-eyebrow">Saved</p>
          <h1 className="pp-title">My Bookmarks</h1>
        </div>
        <div className="pp-empty">
          <p>You haven't bookmarked anything yet.</p>
          <Link to="/catalogue"><button className="btn btn-primary">Browse catalogue</button></Link>
        </div>
      </div>
    );
  }

  // The API returns items grouped by type, with the content's own fields at the
  // top level: { bookmarkId, createdAt, _id (content id), title, ... }. The type
  // is the group key, so it is passed in rather than read off the item.
  const getTargetUrl = (type, b) => {
    switch (type) {
      case 'book': return `/book/${b._id}`;
      case 'chapter': return `/book/${b.bookId}?chapter=${b.chapterNumber}`;
      case 'flashcard': return `/flashcards`;
      case 'roadmapNode': return b.roadmapId ? `/roadmap/${b.roadmapId}` : '/roadmaps';
      default: return '#';
    }
  };

  const getTitle = (type, b) => {
    switch (type) {
      case 'book': return b.title;
      case 'chapter': return `Chapter ${b.chapterNumber}: ${b.title}`;
      case 'flashcard': return (b.front || '').length > 50 ? `${b.front.substring(0, 50)}…` : (b.front || 'Flashcard');
      case 'roadmapNode': return b.title;
      default: return 'Saved Item';
    }
  };

  const getMeta = (type, b) => {
    switch (type) {
      case 'book': return `By ${b.author}`;
      case 'chapter': return b.bookTitle ? `From ${b.bookTitle}` : '';
      case 'flashcard': return `Topic: ${b.topic}`;
      case 'roadmapNode': return [b.roadmapTitle, b.phase && `Phase: ${b.phase}`].filter(Boolean).join(' · ');
      default: return '';
    }
  };

  const categories = [
    { key: 'book', label: 'Books', icon: '📖' },
    { key: 'chapter', label: 'Chapters', icon: '📄' },
    { key: 'flashcard', label: 'Flashcards', icon: '🎴' },
    { key: 'roadmapNode', label: 'Roadmap Steps', icon: '🗺️' }
  ];

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Saved</p>
        <h1 className="pp-title">My Bookmarks</h1>
        <p className="pp-sub">Your saved content, organized by type.</p>
      </div>

      {categories.map(({ key, label, icon }) => {
        const items = bookmarks[key];
        if (!items || items.length === 0) return null;
        return (
          <div key={key}>
            <div className="pp-section-head">
              <h2 className="pp-section-title">{icon} {label}</h2>
              <span className="pp-count">{items.length} saved</span>
            </div>
            <div className="pp-grid">
              {items.map(bookmark => (
                <Link key={bookmark.bookmarkId} to={getTargetUrl(key, bookmark)} className="pp-card-item bkm-card">
                  <button
                    className="bkm-remove"
                    onClick={(e) => handleRemoveBookmark(e, bookmark.bookmarkId)}
                    title="Remove bookmark"
                    aria-label="Remove bookmark"
                  >
                    ×
                  </button>
                  <h3>{getTitle(key, bookmark)}</h3>
                  <p>{getMeta(key, bookmark)}</p>
                  <div className="pp-card-actions">
                    <span className="pp-count">
                      Added {new Date(bookmark.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Bookmarks;
