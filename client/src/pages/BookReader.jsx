import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './BookReader.css';

function BookReader({ user }) {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const fetchBookAndProgress = async () => {
      try {
        const [bookRes, progressRes] = await Promise.all([
          api.get(`/books/${bookId}`),
          api.get(`/progress/${user.id}`)
        ]);

        setBook(bookRes.data);
        setChapters(bookRes.data.chapters);

        const bookProgress = progressRes.data.find(p => p.book._id === bookId);
        if (bookProgress) {
          setProgress(bookProgress);
          const chapterIndex = bookRes.data.chapters.findIndex(ch => ch._id === bookProgress.chapter?._id);
          if (chapterIndex >= 0) setCurrentChapterIndex(chapterIndex);
          setCurrentPage(bookProgress.lastPageRead || 1);
        }
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookAndProgress();
  }, [bookId, user.id]);

  const updateProgress = async (chapterIndex, page, isComplete = false) => {
    try {
      const response = await api.post('/progress', {
        userId: user.id, bookId: bookId, chapterId: chapters[chapterIndex]._id, lastPageRead: page, isChapterComplete: isComplete
      });
      setProgress(response.data);
    } catch (error) { console.error('Error updating progress:', error); }
  };

  const handleNextPage = () => {
    const currentChapter = chapters[currentChapterIndex];
    if (currentPage < currentChapter.pages) {
      const newPage = currentPage + 1; setCurrentPage(newPage); updateProgress(currentChapterIndex, newPage);
    } else if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1); setCurrentPage(1); updateProgress(currentChapterIndex + 1, 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1; setCurrentPage(newPage); updateProgress(currentChapterIndex, newPage);
    } else if (currentChapterIndex > 0) {
      const prevChapter = chapters[currentChapterIndex - 1];
      setCurrentChapterIndex(currentChapterIndex - 1); setCurrentPage(prevChapter.pages); updateProgress(currentChapterIndex - 1, prevChapter.pages);
    }
  };

  const handleChapterSelect = (index) => { setCurrentChapterIndex(index); setCurrentPage(1); updateProgress(index, 1); };
  const handleMarkComplete = async () => { await updateProgress(currentChapterIndex, currentPage, true); };
  const handleAddNote = () => { setShowNoteForm(true); };
  const handleCancelNote = () => { setNoteText(''); setShowNoteForm(false); };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.post('/notes', { userId: user.id, contentType: 'chapter', contentId: chapters[currentChapterIndex]._id, text: noteText });
      setNoteText(''); setShowNoteForm(false);
    } catch (error) { console.error('Error saving note:', error); } finally { setSavingNote(false); }
  };

  if (loading) return <div className="container"><div className="loading-state"><div className="spinner" /><span>Loading book…</span></div></div>;
  if (!book) return <div className="container">Book not found</div>;

  const currentChapter = chapters[currentChapterIndex];
  const isChapterComplete = progress?.completedChapters?.some(ch => ch._id === currentChapter._id);

  return (
    <div className="reader-container">
      <div className="reader-sidebar">
        <div className="book-header">
          <button onClick={() => navigate('/catalogue')} className="btn btn-secondary btn-sm" style={{ marginBottom: 'var(--space-4)' }}>← Back to Catalogue</button>
          <h2>{book.title}</h2>
          <p className="author">by {book.author}</p>
        </div>

        <div className="chapters-list">
          <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>Chapters</h3>
          {chapters.map((chapter, index) => {
            const isCompleted = progress?.completedChapters?.some(ch => ch._id === chapter._id);
            return (
              <div key={chapter._id} className={`chapter-item ${index === currentChapterIndex ? 'active' : ''}`} onClick={() => handleChapterSelect(index)}>
                <span className="chapter-number">{chapter.chapterNumber}</span>
                <span className="chapter-title">{chapter.title}</span>
                {isCompleted && <span className="completed-badge">✓</span>}
              </div>
            );
          })}
        </div>

        <div className="progress-section" style={{ marginTop: 'auto', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-parchment-200)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)', marginBottom: 'var(--space-2)' }}>Your Progress</h3>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(progress?.completedChapters?.length || 0) / chapters.length * 100}%` }} /></div>
          <p className="progress-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-500)', marginTop: 'var(--space-2)' }}>
            {progress?.completedChapters?.length || 0} of {chapters.length} chapters completed
          </p>
        </div>
      </div>

      <div className="reader-pane">
        <div className="chapter-header">
          <div>
            <h1>Chapter {currentChapter.chapterNumber}: {currentChapter.title}</h1>
            <p className="page-indicator">Page {currentPage} of {currentChapter.pages}</p>
          </div>
          {!isChapterComplete ? (
            <button onClick={handleMarkComplete} className="btn btn-success">Mark Chapter Complete</button>
          ) : (
            <span className="badge badge-verdigris" style={{ fontSize: 'var(--text-sm)' }}>✓ Completed</span>
          )}
        </div>

        <div className="content-area">
          <div className="chapter-content" dangerouslySetInnerHTML={{ __html: currentChapter.content.replace(/\n/g, '<br>') }} />
        </div>

        <div className="note-section" style={{ marginTop: 'var(--space-8)' }}>
          {!showNoteForm ? (
            <button onClick={handleAddNote} className="btn btn-secondary">📌 Add Note</button>
          ) : (
            <div className="note-form slide-in">
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>Add a Note</h3>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write your thoughts..." className="form-control" rows="4" autoFocus />
              <div className="note-form-actions" style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button onClick={handleSaveNote} className="btn btn-primary" disabled={savingNote}>{savingNote ? 'Saving...' : 'Save Note'}</button>
                <button onClick={handleCancelNote} className="btn btn-secondary" disabled={savingNote}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="navigation-controls">
          <button onClick={handlePrevPage} className="btn btn-secondary" disabled={currentChapterIndex === 0 && currentPage === 1}>← Previous</button>
          <span className="page-info" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-500)' }}>Page {currentPage} / {currentChapter.pages}</span>
          <button onClick={handleNextPage} className="btn btn-primary" disabled={currentChapterIndex === chapters.length - 1 && currentPage === currentChapter.pages}>Next →</button>
        </div>
      </div>
    </div>
  );
}

export default BookReader;
