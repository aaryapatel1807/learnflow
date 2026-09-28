import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminCRUD.css';

function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({ title: '', author: '', subject: '', difficulty: 'Beginner', description: '', coverImage: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchBooks(); fetchSubjects(); }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/books', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await response.json();
      if (response.status === 403) { setError('Access denied.'); setTimeout(() => navigate('/'), 2000); return; }
      if (!response.ok) throw new Error(data.message);
      setBooks(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/subjects', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (response.ok) setSubjects(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleCreate = () => { setEditingBook(null); setFormData({ title: '', author: '', subject: subjects.length ? subjects[0]._id : '', difficulty: 'Beginner', description: '', coverImage: '' }); setShowModal(true); };
  const handleEdit = (book) => { setEditingBook(book); setFormData({ title: book.title, author: book.author, subject: book.subject._id, difficulty: book.difficulty, description: book.description || '', coverImage: book.coverImage || '' }); setShowModal(true); };
  
  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = editingBook ? `http://localhost:5000/api/admin/books/${editingBook._id}` : 'http://localhost:5000/api/admin/books';
      const response = await fetch(url, { method: editingBook ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(formData) });
      if (!response.ok) throw new Error('Failed to save book');
      setShowModal(false); fetchBooks();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete book?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/books/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!response.ok) throw new Error('Failed to delete');
      fetchBooks();
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="container admin-page"><div className="loading-state"><div className="spinner" /><span>Loading…</span></div></div>;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Admin</p>
        <h1 className="pp-title">Manage Books</h1>
        <p className="pp-sub"><Link to="/admin" className="adm-back-link">← Back to Dashboard</Link></p>
      </div>

      <div className="pp-toolbar" style={{ justifyContent: 'space-between' }}>
        <span className="pp-count">{books.length} books</span>
        <button className="btn btn-primary" onClick={handleCreate}>+ New Book</button>
      </div>

      {error && <div className="adm-error">⚠️ {error}</div>}

      <div className="pp-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Title & Author</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Chapters</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book._id}>
                <td>
                  <div className="adm-cell-title">{book.title}</div>
                  <div className="adm-cell-sub">By {book.author}</div>
                </td>
                <td>{book.subject?.name}</td>
                <td><span className="pp-tag pp-tag-coral">{book.difficulty}</span></td>
                <td><span className="pp-tag pp-tag-grey">{book.chapterCount || 0}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(book)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(book._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {books.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No books found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="adm-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBook ? 'Edit Book' : 'New Book'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label>Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="form-control" />
                </div>
                <div className="adm-form-group">
                  <label>Author</label>
                  <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required className="form-control" />
                </div>
              </div>
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label>Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required className="form-control">
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Difficulty</label>
                  <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="form-control">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="adm-form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-control" rows="3" />
              </div>
              <div className="adm-form-group">
                <label>Cover Image URL (optional)</label>
                <input type="text" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} className="form-control" />
              </div>
              <div className="adm-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBooks;
