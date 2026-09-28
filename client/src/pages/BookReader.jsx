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
    <div className="br-layout">
      <aside className="pp-panel br-sidebar">
        <div className="br-book-head">
          <button onClick={() => navigate('/catalogue')} className="btn btn-secondary btn-sm">← Catalogue</button>
          <h2>{book.title}</h2>
          <p className="br-author">by {book.author}</p>
        </div>

        <div className="br-chapters">
          <p className="pp-eyebrow">Chapters</p>
          {chapters.map((chapter, index) => {
            const isCompleted = progress?.completedChapters?.some(ch => ch._id === chapter._id);
            return (
              <div
                key={chapter._id}
                className={`br-chapter ${index === currentChapterIndex ? 'active' : ''}`}
                onClick={() => handleChapterSelect(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleChapterSelect(index)}
              >
                <span className="br-chapter-num">{chapter.chapterNumber}</span>
                <span className="br-chapter-title">{chapter.title}</span>
                {isCompleted && <span className="br-done">✓</span>}
              </div>
            );
          })}
        </div>

        <div className="br-progress">
          <p className="pp-eyebrow">Your Progress</p>
          <div className="pp-progress">
            <div className="pp-progress-fill" style={{ width: `${(progress?.completedChapters?.length || 0) / chapters.length * 100}%` }} />
          </div>
          <p className="pp-count" style={{ marginTop: '8px' }}>
            {progress?.completedChapters?.length || 0} of {chapters.length} chapters completed
          </p>
        </div>
      </aside>

      <main className="br-pane">
        <div className="pp-panel br-chapter-head">
          <div>
            <p className="pp-eyebrow" style={{ marginBottom: '4px' }}>Page {currentPage} of {currentChapter.pages}</p>
            <h1 className="pp-title">Chapter {currentChapter.chapterNumber}: {currentChapter.title}</h1>
          </div>
          {!isChapterComplete ? (
            <button onClick={handleMarkComplete} className="btn btn-primary">Mark Chapter Complete</button>
          ) : (
            <span className="pp-pill pp-pill-done">✓ Completed</span>
          )}
        </div>

        <div className="pp-panel br-content">
          <div className="br-chapter-text" dangerouslySetInnerHTML={{ __html: currentChapter.content.replace(/\n/g, '<br>') }} />
        </div>

        <div className="br-note">
          {!showNoteForm ? (
            <button onClick={handleAddNote} className="btn btn-secondary">📌 Add Note</button>
          ) : (
            <div className="pp-panel">
              <h3 className="br-note-title">Add a Note</h3>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write your thoughts..." className="form-control br-note-input" rows="4" autoFocus />
              <div className="br-note-actions">
                <button onClick={handleSaveNote} className="btn btn-primary" disabled={savingNote}>{savingNote ? 'Saving...' : 'Save Note'}</button>
                <button onClick={handleCancelNote} className="btn btn-secondary" disabled={savingNote}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="pp-panel br-nav">
          <button onClick={handlePrevPage} className="btn btn-secondary" disabled={currentChapterIndex === 0 && currentPage === 1}>← Previous</button>
          <span className="pp-count">Page {currentPage} / {currentChapter.pages}</span>
          <button onClick={handleNextPage} className="btn btn-primary" disabled={currentChapterIndex === chapters.length - 1 && currentPage === currentChapter.pages}>Next →</button>
        </div>
      </main>
    </div>
  );
}

export default BookReader;
