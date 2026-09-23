import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminCRUD.css';

function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/subjects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.status === 403) {
        setError('Access denied.'); setTimeout(() => navigate('/'), 2000); return;
      }
      if (!response.ok) throw new Error(data.message);
      setSubjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => { setEditingSubject(null); setFormData({ name: '', description: '', icon: '' }); setShowModal(true); };
  const handleEdit = (subject) => { setEditingSubject(subject); setFormData({ name: subject.name, description: subject.description || '', icon: subject.icon || '' }); setShowModal(true); };
  
  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = editingSubject ? `http://localhost:5000/api/admin/subjects/${editingSubject._id}` : 'http://localhost:5000/api/admin/subjects';
      const response = await fetch(url, {
        method: editingSubject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save subject');
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete subject?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/subjects/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete');
      fetchSubjects();
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="container admin-page"><div className="loading-state"><div className="spinner" /><span>Loading…</span></div></div>;

  return (
    <div className="admin-page" style={{ minHeight: '100vh' }}>
      <div className="admin-header-stripe">
        <div className="container admin-header-content">
          <div>
            <h1>Manage Subjects</h1>
            <p className="subtitle"><Link to="/admin" style={{ color: 'var(--color-parchment-300)' }}>← Back to Dashboard</Link></p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>+ New Subject</button>
        </div>
      </div>

      <div className="container">
        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Description</th>
                <th>Books</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => (
                <tr key={subject._id}>
                  <td style={{ fontSize: '1.5rem' }}>{subject.icon || '📚'}</td>
                  <td style={{ fontWeight: 'var(--weight-semibold)' }}>{subject.name}</td>
                  <td style={{ color: 'var(--color-ink-500)', maxWidth: '300px' }}>{subject.description || '-'}</td>
                  <td><span className="badge badge-ink">{subject.bookCount || 0}</span></td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(subject)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(subject._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No subjects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>{editingSubject ? 'Edit Subject' : 'New Subject'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="form-control" />
              </div>
              <div className="admin-form-group">
                <label>Icon (emoji)</label>
                <input type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="form-control" />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-control" rows="3" />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSubjects;
