import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminCRUD.css';

const PAGE_SIZE = 100;

function AdminFlashcards() {
  const [cards, setCards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({ front: '', back: '', topic: '', subject: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchSubjects(); }, []);
  useEffect(() => { fetchCards(); }, [subjectFilter]);

  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  const fetchCards = async () => {
    setLoading(true);
    try {
      const qs = subjectFilter ? `?subject=${subjectFilter}` : '';
      const response = await fetch(`/api/admin/flashcards${qs}`, { headers: authHeaders() });
      const data = await response.json();
      if (response.status === 403) { setError('Access denied.'); setTimeout(() => navigate('/'), 2000); return; }
      if (!response.ok) throw new Error(data.message);
      setCards(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects', { headers: authHeaders() });
      if (response.ok) setSubjects(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleCreate = () => {
    setEditingCard(null);
    setFormData({ front: '', back: '', topic: '', subject: subjects.length ? subjects[0]._id : '' });
    setShowModal(true);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({ front: card.front, back: card.back, topic: card.topic, subject: card.subject?._id || card.subject });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = editingCard ? `/api/admin/flashcards/${editingCard._id}` : '/api/admin/flashcards';
      const response = await fetch(url, {
        method: editingCard ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save flashcard');
      setShowModal(false); fetchCards();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete flashcard?')) return;
    try {
      const response = await fetch(`/api/admin/flashcards/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to delete');
      fetchCards();
    } catch (err) { setError(err.message); }
  };

  const visible = cards.slice(0, PAGE_SIZE);

  if (loading) return <div className="container admin-page"><div className="loading-state"><div className="spinner" /><span>Loading…</span></div></div>;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Admin</p>
        <h1 className="pp-title">Manage Flashcards</h1>
        <p className="pp-sub"><Link to="/admin" className="adm-back-link">← Back to Dashboard</Link></p>
      </div>

      <div className="pp-toolbar" style={{ justifyContent: 'space-between' }}>
        <div className="adm-form-group" style={{ margin: 0, minWidth: '220px' }}>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="form-control">
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>+ New Flashcard</button>
      </div>

      {error && <div className="adm-error">⚠️ {error}</div>}
      {cards.length > PAGE_SIZE && <p className="pp-count">Showing first {PAGE_SIZE} of {cards.length} cards.</p>}

      <div className="pp-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Front</th>
              <th>Back</th>
              <th>Topic</th>
              <th>Subject</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(card => (
              <tr key={card._id}>
                <td>
                  <div className="adm-cell-title">{(card.front || '').substring(0, 80)}{(card.front || '').length > 80 ? '…' : ''}</div>
                  {card.sourceType && card.sourceType !== 'manual' && <div className="adm-cell-sub">{card.sourceType}</div>}
                </td>
                <td>{(card.back || '').substring(0, 80)}{(card.back || '').length > 80 ? '…' : ''}</td>
                <td>{card.topic}</td>
                <td>{card.subject?.name}</td>
                <td>
                  <div className="adm-table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(card)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(card._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No flashcards found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="adm-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCard ? 'Edit Flashcard' : 'New Flashcard'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="adm-form-group">
                <label>Front</label>
                <textarea value={formData.front} onChange={e => setFormData({...formData, front: e.target.value})} required className="form-control" rows="3" />
              </div>
              <div className="adm-form-group">
                <label>Back</label>
                <textarea value={formData.back} onChange={e => setFormData({...formData, back: e.target.value})} required className="form-control" rows="3" />
              </div>
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label>Topic</label>
                  <input type="text" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} required className="form-control" />
                </div>
                <div className="adm-form-group">
                  <label>Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required className="form-control">
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="adm-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Flashcard'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFlashcards;
