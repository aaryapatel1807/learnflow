import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminCRUD.css';

function AdminChapters() {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({ chapterNumber: 1, title: '', content: '', pages: 1 });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchBooks(); }, []);

  useEffect(() => {
    if (selectedBookId) fetchChapters(selectedBookId);
    else setChapters([]);
  }, [selectedBookId]);

  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/admin/books', { headers: authHeaders() });
      const data = await response.json();
      if (response.status === 403) { setError('Access denied.'); setTimeout(() => navigate('/'), 2000); return; }
      if (!response.ok) throw new Error(data.message);
      setBooks(data);
      if (data.length > 0) setSelectedBookId(data[0]._id);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const fetchChapters = async (bookId) => {
    try {
      const response = await fetch(`/api/admin/books/${bookId}`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch chapters');
      setChapters(data.chapters || []);
    } catch (err) { setError(err.message); }
  };

  const nextChapterNumber = () => chapters.length > 0 ? Math.max(...chapters.map(c => c.chapterNumber)) + 1 : 1;

  const handleCreate = () => {
    setEditingChapter(null);
    setFormData({ chapterNumber: nextChapterNumber(), title: '', content: '', pages: 1 });
    setShowModal(true);
  };

  const handleEdit = (chapter) => {
    setEditingChapter(chapter);
    setFormData({ chapterNumber: chapter.chapterNumber, title: chapter.title, content: chapter.content, pages: chapter.pages || 1 });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = editingChapter
        ? `/api/admin/books/${selectedBookId}/chapters/${editingChapter._id}`
        : `/api/admin/books/${selectedBookId}/chapters`;
      const response = await fetch(url, {
        method: editingChapter ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ...formData, chapterNumber: Number(formData.chapterNumber), pages: Number(formData.pages) || 1 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save chapter');
      setShowModal(false); fetchChapters(selectedBookId);
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete chapter?')) return;
    try {
      const response = await fetch(`/api/admin/books/${selectedBookId}/chapters/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to delete');
      fetchChapters(selectedBookId);
    } catch (err) { setError(err.message); }
  };

  const handleMove = async (index, direction) => {
    const other = index + direction;
    if (other < 0 || other >= chapters.length) return;
    const a = chapters[index], b = chapters[other];
    try {
      const response = await fetch(`/api/admin/books/${selectedBookId}/chapters/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ chapters: [
          { chapterId: a._id, chapterNumber: b.chapterNumber },
          { chapterId: b._id, chapterNumber: a.chapterNumber }
        ] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reorder');
      setChapters(data.chapters);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="container admin-page"><div className="loading-state"><div className="spinner" /><span>Loading…</span></div></div>;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Admin</p>
        <h1 className="pp-title">Manage Chapters</h1>
        <p className="pp-sub"><Link to="/admin" className="adm-back-link">← Back to Dashboard</Link></p>
      </div>

      <div className="pp-toolbar" style={{ justifyContent: 'space-between' }}>
        <div className="adm-form-group" style={{ margin: 0, minWidth: '260px' }}>
          <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} className="form-control">
            {books.map(b => <option key={b._id} value={b._id}>{b.title} ({b.chapterCount || 0} chapters)</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleCreate} disabled={!selectedBookId}>+ New Chapter</button>
      </div>

      {error && <div className="adm-error">⚠️ {error}</div>}

      <div className="pp-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Title</th>
              <th>Pages</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((chapter, i) => (
              <tr key={chapter._id}>
                <td><span className="pp-tag pp-tag-grey">{chapter.chapterNumber}</span></td>
                <td>
                  <div className="adm-cell-title">{chapter.title}</div>
                  <div className="adm-cell-sub">{(chapter.content || '').substring(0, 80)}{(chapter.content || '').length > 80 ? '…' : ''}</div>
                </td>
                <td>{chapter.pages || 1}</td>
                <td>
                  <div className="adm-table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleMove(i, -1)} disabled={i === 0} title="Move up">↑</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleMove(i, 1)} disabled={i === chapters.length - 1} title="Move down">↓</button>
                  </div>
                </td>
                <td>
                  <div className="adm-table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(chapter)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(chapter._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {chapters.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>{selectedBookId ? 'No chapters yet.' : 'Select a book.'}</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="adm-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingChapter ? 'Edit Chapter' : 'New Chapter'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label>Chapter Number</label>
                  <input type="number" min="1" value={formData.chapterNumber} onChange={e => setFormData({...formData, chapterNumber: e.target.value})} required className="form-control" />
                </div>
                <div className="adm-form-group">
                  <label>Pages</label>
                  <input type="number" min="1" value={formData.pages} onChange={e => setFormData({...formData, pages: e.target.value})} className="form-control" />
                </div>
              </div>
              <div className="adm-form-group">
                <label>Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="form-control" />
              </div>
              <div className="adm-form-group">
                <label>Content</label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required className="form-control" rows="8" />
              </div>
              <div className="adm-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Chapter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminChapters;
