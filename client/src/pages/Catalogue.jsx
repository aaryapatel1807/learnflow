import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './Catalogue.css';

function Catalogue() {
  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const userId = user?.id || user?._id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          api.get('/subjects'),
          api.get('/books')
        ];

        if (userId) {
          requests.push(api.get(`/progress/${userId}`));
          requests.push(api.get(`/bookmarks/${userId}`));
        }

        const results = await Promise.all(requests);
        const subjectsRes = results[0];
        const booksRes = results[1];
        const progressRes = userId ? results[2] : null;
        const bookmarksRes = userId ? results[3] : null;

        // Safely extract array from responses (whether wrapped in { success, data: [...] } or returned directly)
        const subjectsList = Array.isArray(subjectsRes?.data?.data)
          ? subjectsRes.data.data
          : (Array.isArray(subjectsRes?.data) ? subjectsRes.data : []);

        const booksList = Array.isArray(booksRes?.data?.data)
          ? booksRes.data.data
          : (Array.isArray(booksRes?.data) ? booksRes.data : []);

        setSubjects(subjectsList);
        setBooks(booksList);

        if (progressRes) {
          const progressData = Array.isArray(progressRes?.data?.data)
            ? progressRes.data.data
            : (Array.isArray(progressRes?.data) ? progressRes.data : []);
          const progressMap = {};
          progressData.forEach(p => {
            if (p?.book?._id) progressMap[p.book._id] = p;
          });
          setProgress(progressMap);
        }

        if (bookmarksRes) {
          const bookmarksData = bookmarksRes?.data?.book || (Array.isArray(bookmarksRes?.data) ? bookmarksRes.data : []);
          const bookmarksMap = {};
          if (Array.isArray(bookmarksData)) {
            bookmarksData.forEach(b => {
              if (b?._id) bookmarksMap[b._id] = true;
            });
          }
          setBookmarks(bookmarksMap);
        }
      } catch (error) {
        console.error('Error fetching catalogue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const toggleBookmark = async (bookId, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!userId) return;
    try {
      await api.post('/bookmarks/toggle', { userId, contentType: 'book', contentId: bookId });
      setBookmarks(prev => {
        const next = { ...prev };
        if (next[bookId]) delete next[bookId];
        else next[bookId] = true;
        return next;
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state"><div className="spinner" /><span>Loading catalogue…</span></div>
      </div>
    );
  }

  // Use the first book as the featured spotlight
  const featuredBook = books.length > 0 ? books[0] : null;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Catalogue</p>
        <h1 className="pp-title">Learning Catalogue</h1>
        <p className="pp-sub">Explore subjects and books at your own pace.</p>
      </div>

      {/* FEATURED SPOTLIGHT */}
      {featuredBook && (
        <div className="pp-panel cat-spotlight">
          <div className="cat-spotlight-cover">
            {featuredBook.coverImage ? (
              <img src={featuredBook.coverImage} alt={featuredBook.title} />
            ) : (
              <span>📖</span>
            )}
          </div>
          <div className="cat-spotlight-body">
            <span className="pp-tag pp-tag-coral">✨ Featured Choice</span>
            <h2>{featuredBook.title}</h2>
            <div className="cat-spotlight-author">by {featuredBook.author}</div>
            {featuredBook.description && (
              <p className="cat-spotlight-desc">{featuredBook.description}</p>
            )}
            <Link to={`/book/${featuredBook._id}`}>
              <button className="btn btn-primary">Start reading →</button>
            </Link>
          </div>
        </div>
      )}

      {/* SUBJECTS */}
      <div className="pp-section-head">
        <h2 className="pp-section-title">Subjects</h2>
        <span className="pp-count">{subjects.length} subjects</span>
      </div>
      <div className="pp-tags" style={{ marginBottom: 'var(--space-2)' }}>
        {subjects.map(subject => (
          <Link to={`/skill-tree/${subject._id}`} key={subject._id} className="pp-tag cat-subject">
            {subject.name} · {subject.bookCount || 0}
          </Link>
        ))}
      </div>

      {/* BOOKS GRID */}
      <div className="pp-section-head">
        <h2 className="pp-section-title">Available Books</h2>
        <span className="pp-count">{books.length} items</span>
      </div>
      <div className="pp-grid">
        {books.map(book => {
          const bookProgress = progress[book._id];
          const completedChapters = bookProgress?.completedChapters?.length || 0;
          const progressPercent = book.chapterCount > 0
            ? (completedChapters / book.chapterCount) * 100
            : 0;
          const subjectName = typeof book.subject === 'object' ? (book.subject?.name || 'General') : (book.subject || 'General');

          return (
            <Link to={`/book/${book._id}`} key={book._id} className="pp-card-item cat-book">
              <div className="cat-book-top">
                <div className="cat-book-cover">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} />
                  ) : (
                    <span>📖</span>
                  )}
                </div>
                <div className="cat-book-info">
                  <div className="pp-tags">
                    <span className="pp-tag pp-tag-blue">{subjectName}</span>
                    {book.difficulty && <span className="pp-tag pp-tag-coral">{book.difficulty}</span>}
                  </div>
                  <h3>{book.title}</h3>
                  <p>by {book.author}</p>
                </div>
                <button
                  className="cat-bookmark"
                  onClick={(e) => toggleBookmark(book._id, e)}
                  title={bookmarks[book._id] ? 'Remove bookmark' : 'Add bookmark'}
                  aria-label={bookmarks[book._id] ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {bookmarks[book._id] ? '🔖' : '📑'}
                </button>
              </div>

              {bookProgress && (
                <div className="pp-progress" style={{ marginTop: 'var(--space-2)' }}>
                  <div className="pp-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              )}

              <div className="cat-book-meta">
                <span>{book.chapterCount || 0} chapters</span>
                <span className="cat-book-action">
                  {bookProgress ? 'Continue →' : 'Start →'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Catalogue;
