import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './Catalogue.css';

const PAGE_SIZE = 12;
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

function Catalogue() {
  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(false);

  // Search / filter / pagination state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const debounceRef = useRef(null);

  const user = getUser();
  const userId = user?.id || user?._id;

  // Debounce the search input (~300ms) before it hits the API.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // Subjects, progress and bookmarks load once (not per page).
  useEffect(() => {
    const fetchStatic = async () => {
      try {
        const requests = [api.get('/subjects')];
        if (userId) {
          requests.push(api.get(`/progress/${userId}`));
          requests.push(api.get(`/bookmarks/${userId}`));
        }
        const results = await Promise.all(requests);
        const subjectsRes = results[0];
        const progressRes = userId ? results[1] : null;
        const bookmarksRes = userId ? results[2] : null;

        const subjectsList = Array.isArray(subjectsRes?.data?.data)
          ? subjectsRes.data.data
          : (Array.isArray(subjectsRes?.data) ? subjectsRes.data : []);
        setSubjects(subjectsList);

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
        console.error('Error fetching catalogue data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatic();
  }, [userId]);

  // Books reload whenever search, filters or page change.
  useEffect(() => {
    const fetchBooks = async () => {
      setBooksLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (search) params.set('search', search);
        if (subjectFilter !== 'all') params.set('subject', subjectFilter);
        if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter);
        const res = await api.get(`/books?${params.toString()}`);
        const booksList = Array.isArray(res?.data?.data) ? res.data.data : [];
        setBooks(booksList);
        setTotalPages(res?.data?.totalPages || 1);
        setTotalBooks(res?.data?.total ?? booksList.length);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setBooksLoading(false);
      }
    };
    fetchBooks();
  }, [search, subjectFilter, difficultyFilter, page]);

  const hasActiveFilters = search !== '' || subjectFilter !== 'all' || difficultyFilter !== 'all';

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

  // Featured spotlight shows the first result when nothing is being filtered.
  const featuredBook = !hasActiveFilters && page === 1 && books.length > 0 ? books[0] : null;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Catalogue</p>
        <h1 className="pp-title">Learning Catalogue</h1>
        <p className="pp-sub">Explore subjects and books at your own pace.</p>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="pp-panel cat-filters">
        <div className="cat-search">
          <span className="cat-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or author…"
            aria-label="Search books by title or author"
          />
          {searchInput && (
            <button
              type="button"
              className="cat-clear"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className="cat-filter-row">
          <label className="cat-filter">
            <span>Subject</span>
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              aria-label="Filter by subject"
            >
              <option value="all">All subjects</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="cat-filter">
            <span>Difficulty</span>
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
              aria-label="Filter by difficulty"
            >
              <option value="all">All levels</option>
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
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
        <span className="pp-count">{totalBooks} items</span>
      </div>
      {booksLoading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading books…</span></div>
      ) : books.length === 0 ? (
        <div className="pp-panel">
          <div className="pp-empty">
            <p>No books match your search. Try a different title, author or filter.</p>
          </div>
        </div>
      ) : (
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
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="cat-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="cat-page-info">Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Catalogue;
