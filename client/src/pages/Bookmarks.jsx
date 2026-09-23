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
      <div className="container bookmarks-page">
        <h1>My Bookmarks</h1>
        <div className="empty-state">
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
    <div className="container bookmarks-page">
      <h1>My Bookmarks</h1>
      <p className="page-subtitle">Your saved content, organized by type.</p>

      {categories.map(({ key, label, icon }) => {
        const items = bookmarks[key];
        if (!items || items.length === 0) return null;
        return (
          <div key={key} className="bookmark-category">
            <h2>
              {icon} {label}
              <span className="badge badge-ink">{items.length}</span>
            </h2>
            <div className="bookmarks-grid">
              {items.map(bookmark => (
                <Link key={bookmark._id} to={getTargetUrl(bookmark)} className="bookmark-card">
                  <button
                    className="bookmark-remove"
                    onClick={(e) => handleRemoveBookmark(e, bookmark._id)}
                    title="Remove bookmark"
                  >
                    ×
                  </button>
                  <h3>{getTitle(bookmark)}</h3>
                  <p className="bookmark-meta">{getMeta(bookmark)}</p>
                  <span className="bookmark-date">
                    Added {new Date(bookmark.createdAt).toLocaleDateString()}
                  </span>
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
