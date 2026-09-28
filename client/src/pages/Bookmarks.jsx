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

  const getTargetUrl = (bookmark) => {
    switch (bookmark.contentType) {
      case 'book': return `/book/${bookmark.contentId._id}`;
      case 'chapter': return `/book/${bookmark.contentId.bookId}?chapter=${bookmark.contentId.chapterNumber}`;
      case 'flashcard': return `/flashcards`;
      case 'roadmapNode': return `/roadmap/${bookmark.contentId.roadmapId}`;
      default: return '#';
    }
  };

  const getTitle = (bookmark) => {
    switch (bookmark.contentType) {
      case 'book': return bookmark.contentId.title;
      case 'chapter': return `Chapter ${bookmark.contentId.chapterNumber}: ${bookmark.contentId.title}`;
      case 'flashcard': return bookmark.contentId.front.substring(0, 50) + '...';
      case 'roadmapNode': return bookmark.contentId.title;
      default: return 'Saved Item';
    }
  };

  const getMeta = (bookmark) => {
    switch (bookmark.contentType) {
      case 'book': return `By ${bookmark.contentId.author}`;
      case 'chapter': return `Book ID: ${bookmark.contentId.bookId}`;
      case 'flashcard': return `Topic: ${bookmark.contentId.topic}`;
      case 'roadmapNode': return `Phase: ${bookmark.contentId.phase}`;
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
                <Link key={bookmark._id} to={getTargetUrl(bookmark)} className="pp-card-item bkm-card">
                  <button
                    className="bkm-remove"
                    onClick={(e) => handleRemoveBookmark(e, bookmark._id)}
                    title="Remove bookmark"
                    aria-label="Remove bookmark"
                  >
                    ×
                  </button>
                  <h3>{getTitle(bookmark)}</h3>
                  <p>{getMeta(bookmark)}</p>
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
