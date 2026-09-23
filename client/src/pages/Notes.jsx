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

  if (subjects.length === 0) {
    return (
      <div className="container notes-page">
        <h1>My Notes</h1>
        <div className="empty-state">
          <p>No notes yet. Start reading and pin your thoughts as you go.</p>
          <Link to="/catalogue"><button className="btn btn-primary">Browse catalogue</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container notes-page">
      <div className="notes-header">
        <h1>My Notes</h1>
        <Link to="/catalogue"><button className="btn btn-secondary btn-sm">+ Add more notes</button></Link>
      </div>

      {subjects.map(subject => (
        <div key={subject} className="book-group">
          <h2 className="book-group-title">
            {subject}
            <span className="group-count">
              {groupedNotes[subject].length} {groupedNotes[subject].length === 1 ? 'note' : 'notes'}
            </span>
          </h2>

          {groupedNotes[subject].map(note => (
            <div key={note._id} className="note-card">
              <div className="note-card-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-ink-700)' }}>
                    {note.contentDetails?.bookTitle}
                  </span>
                  {note.contentDetails && (
                    <span className="note-chapter">
                      Ch. {note.contentDetails.chapterNumber}: {note.contentDetails.title}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <span className="note-date">
                    {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {editingNote !== note._id && (
                    <>
                      <button onClick={() => handleEdit(note)} className="btn btn-secondary btn-sm" title="Edit">Edit</button>
                      <button onClick={() => handleDelete(note._id)} className="btn btn-danger btn-sm" title="Delete">Delete</button>
                    </>
                  )}
                </div>
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
          ))}
        </div>
      ))}
    </div>
  );
}

export default Notes;
