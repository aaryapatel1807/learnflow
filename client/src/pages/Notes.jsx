import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getUser } from '../utils/auth';
import './Notes.css';

function Notes() {
  const [groupedNotes, setGroupedNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState('');
  const [query, setQuery] = useState('');
  const user = getUser();

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get(`/notes/${user.id}`);
      setGroupedNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note) => { setEditingNote(note._id); setEditText(note.text); };
  const handleSaveEdit = async (noteId) => {
    try { await api.put(`/notes/${noteId}`, { text: editText }); setEditingNote(null); fetchNotes(); }
    catch (error) { console.error('Error updating note:', error); }
  };
  const handleCancelEdit = () => { setEditingNote(null); setEditText(''); };
  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try { await api.delete(`/notes/${noteId}`); fetchNotes(); }
    catch (error) { console.error('Error deleting note:', error); }
  };

  if (loading) {
    return <div className="container"><div className="loading-state"><div className="spinner" /><span>Loading notes…</span></div></div>;
  }

  const subjects = Object.keys(groupedNotes);

  // Client-side search across note text, book title and chapter title.
  const q = query.trim().toLowerCase();
  const visibleSubjects = q
    ? subjects
        .map((subject) => ({
          subject,
          notes: groupedNotes[subject].filter((n) =>
            [n.text, n.contentDetails?.bookTitle, n.contentDetails?.title]
              .filter(Boolean)
              .some((t) => t.toLowerCase().includes(q))
          ),
        }))
        .filter((g) => g.notes.length > 0)
    : subjects.map((subject) => ({ subject, notes: groupedNotes[subject] }));
  const totalVisible = visibleSubjects.reduce((s, g) => s + g.notes.length, 0);

  if (subjects.length === 0) {
    return (
      <div className="container">
        <div className="pp-hero">
          <p className="pp-eyebrow">Notes</p>
          <h1 className="pp-title">My Notes</h1>
        </div>
        <div className="pp-empty">
          <p>No notes yet. Start reading and pin your thoughts as you go.</p>
          <Link to="/catalogue"><button className="btn btn-primary">Browse catalogue</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Notes</p>
        <h1 className="pp-title">My Notes</h1>
        <p className="pp-sub">Everything you've pinned while reading, grouped by subject.</p>
      </div>

      <div className="pp-toolbar" style={{ justifyContent: 'space-between' }}>
        <input
          type="search"
          className="pp-search"
          placeholder="Search notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search notes"
          style={{ maxWidth: '280px' }}
        />
        <Link to="/catalogue"><button className="btn btn-secondary btn-sm">+ Add more notes</button></Link>
      </div>

      {q && (
        <p className="pp-count" style={{ margin: '4px 0 12px' }}>
          {totalVisible} {totalVisible === 1 ? 'match' : 'matches'} for “{query.trim()}”
        </p>
      )}

      {visibleSubjects.map(({ subject, notes }) => (
        <div key={subject}>
          <div className="pp-section-head">
            <h2 className="pp-section-title">{subject}</h2>
            <span className="pp-count">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          <div className="pp-rows">
          {notes.map(note => (
            <div key={note._id} className="pp-row">
              <div className="pp-row-main">
                <div className="pp-tags" style={{ marginBottom: '6px' }}>
                  <span className="pp-tag pp-tag-blue">{note.contentDetails?.bookTitle}</span>
                  {note.contentDetails && (
                    <span className="pp-tag pp-tag-grey">
                      Ch. {note.contentDetails.chapterNumber}: {note.contentDetails.title}
                    </span>
                  )}
                  <span className="pp-count">
                    {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {editingNote === note._id ? (
                  <div className="note-edit-form">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="4"
                      autoFocus
                    />
                    <div className="note-edit-actions">
                      <button onClick={() => handleSaveEdit(note._id)} className="btn btn-primary btn-sm">Save</button>
                      <button onClick={handleCancelEdit} className="btn btn-secondary btn-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="note-text">{note.text}</p>
                )}
              </div>
              {editingNote !== note._id && (
                <div className="note-row-actions">
                  <button onClick={() => handleEdit(note)} className="btn btn-secondary btn-sm" title="Edit">Edit</button>
                  <button onClick={() => handleDelete(note._id)} className="btn btn-danger btn-sm" title="Delete">Delete</button>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Notes;
