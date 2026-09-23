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
    <div className="container catalogue-page">
      <h1 className="animate-rise">Learning Catalogue</h1>
      <p className="page-subtitle animate-rise">Explore subjects and books at your own pace.</p>

      {/* FEATURED SPOTLIGHT */}
      {featuredBook && (
        <div className="featured-spotlight animate-rise" data-delay="1">
          <div className="spotlight-cover">
            {featuredBook.coverImage ? (
              <img src={featuredBook.coverImage} alt={featuredBook.title} />
            ) : (
              <span>📖</span>
            )}
          </div>
          <div className="spotlight-body">
            <span className="scholar-chip chip-ember spotlight-label">✨ Featured Choice</span>
            <h2 className="spotlight-title">{featuredBook.title}</h2>
            <div className="spotlight-author">by {featuredBook.author}</div>
            {featuredBook.description && (
              <div className="spotlight-desc">{featuredBook.description}</div>
            )}
            <Link to={`/book/${featuredBook._id}`}>
              <button className="btn btn-primary press">Start reading →</button>
            </Link>
          </div>
        </div>
      )}

      {/* SUBJECTS STRIP */}
      <section className="subjects-section animate-rise" data-delay="2">
        <h2>Subjects</h2>
        <div className="subjects-grid">
          {subjects.map(subject => (
            <Link to={`/skill-tree/${subject._id}`} key={subject._id} className="subject-chip press">
              <span className="subject-chip-name">{subject.name}</span>
              <span className="subject-chip-count">{subject.bookCount || 0}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BOOKS GRID */}
      <section className="books-section animate-rise" data-delay="3">
        <div className="books-section-header">
          <h2>Available Books</h2>
          <span className="books-count">{books.length} items</span>
        </div>
        <div className="books-grid">
          {books.map(book => {
            const bookProgress = progress[book._id];
            const completedChapters = bookProgress?.completedChapters?.length || 0;
            const progressPercent = book.chapterCount > 0
              ? (completedChapters / book.chapterCount) * 100
              : 0;
            const difficultyClass = book.difficulty ? `difficulty-${book.difficulty.toLowerCase()}` : '';
            const subjectName = typeof book.subject === 'object' ? (book.subject?.name || 'General') : (book.subject || 'General');

            return (
              <Link to={`/book/${book._id}`} key={book._id} className="book-card">
                <div className="book-card-top">
                  <div className="book-cover-placeholder">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--radius-data)'}}/>
                    ) : (
                      '📖'
                    )}
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div className="book-badges" style={{marginBottom: 'var(--space-2)'}}>
                      <span className="book-subject-tag">{subjectName}</span>
                      <span className={`book-difficulty-tag ${difficultyClass}`}>{book.difficulty}</span>
                    </div>
                    <h3 className="book-card-title">{book.title}</h3>
                    <p className="book-card-author">by {book.author}</p>
                  </div>
                  <button
                    className="theme-toggle"
                    style={{marginLeft: '-10px', marginTop: '-5px'}}
                    onClick={(e) => toggleBookmark(book._id, e)}
                    title={bookmarks[book._id] ? 'Remove bookmark' : 'Add bookmark'}
                    aria-label={bookmarks[book._id] ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    {bookmarks[book._id] ? '🔖' : '🔖'}
                  </button>
                </div>

                {bookProgress && (
                  <div className="book-progress" style={{marginTop: 'var(--space-2)'}}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}

                <div className="book-card-meta" style={{marginTop: 'auto'}}>
                  <span>{book.chapterCount || 0} chapters</span>
                  {bookProgress ? (
                    <span className="book-card-action">Continue →</span>
                  ) : (
                    <span className="book-card-action">Start →</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Catalogue;
