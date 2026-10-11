import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminCRUD.css';

const EMPTY_QUIZ = { title: '', description: '', topic: '', subject: '', difficulty: 'Beginner', timeLimitMinutes: '' };
const EMPTY_QUESTION = { questionText: '', optionsText: '', correctOption: 1, topic: '', explanation: '' };

function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ);
  const [submitting, setSubmitting] = useState(false);
  // Question manager state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showQModal, setShowQModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qForm, setQForm] = useState(EMPTY_QUESTION);
  const navigate = useNavigate();

  useEffect(() => { fetchQuizzes(); fetchSubjects(); }, []);

  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/admin/quizzes', { headers: authHeaders() });
      const data = await response.json();
      if (response.status === 403) { setError('Access denied.'); setTimeout(() => navigate('/'), 2000); return; }
      if (!response.ok) throw new Error(data.message);
      setQuizzes(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects', { headers: authHeaders() });
      if (response.ok) setSubjects(await response.json());
    } catch (err) { console.error(err); }
  };

  const openQuestions = async (quiz) => {
    setActiveQuiz(quiz); setError('');
    try {
      const response = await fetch(`/api/admin/quizzes/${quiz._id}`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch questions');
      setQuestions(data.questions || []);
    } catch (err) { setError(err.message); }
  };

  // ---- Quiz CRUD ----
  const handleCreateQuiz = () => { setEditingQuiz(null); setQuizForm({ ...EMPTY_QUIZ, subject: subjects.length ? subjects[0]._id : '' }); setShowQuizModal(true); };
  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({ title: quiz.title, description: quiz.description || '', topic: quiz.topic, subject: quiz.subject?._id || quiz.subject, difficulty: quiz.difficulty, timeLimitMinutes: quiz.timeLimitMinutes || '' });
    setShowQuizModal(true);
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const url = editingQuiz ? `/api/admin/quizzes/${editingQuiz._id}` : '/api/admin/quizzes';
      const response = await fetch(url, {
        method: editingQuiz ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ...quizForm, timeLimitMinutes: quizForm.timeLimitMinutes ? Number(quizForm.timeLimitMinutes) : null })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save quiz');
      setShowQuizModal(false); fetchQuizzes();
      if (activeQuiz && editingQuiz && activeQuiz._id === editingQuiz._id) setActiveQuiz(data.quiz);
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Delete quiz and all its questions?')) return;
    try {
      const response = await fetch(`/api/admin/quizzes/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to delete');
      if (activeQuiz?._id === id) { setActiveQuiz(null); setQuestions([]); }
      fetchQuizzes();
    } catch (err) { setError(err.message); }
  };

  // ---- Question CRUD ----
  const parseOptions = (text) => text.split('\n').map(o => o.trim()).filter(Boolean);

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setQForm({ ...EMPTY_QUESTION, topic: activeQuiz.topic || '' });
    setShowQModal(true);
  };

  const handleEditQuestion = (q) => {
    setEditingQuestion(q);
    setQForm({
      questionText: q.questionText,
      optionsText: (q.options || []).join('\n'),
      correctOption: (q.correctOptionIndex ?? 0) + 1,
      topic: q.topic || '',
      explanation: q.explanation || ''
    });
    setShowQModal(true);
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const options = parseOptions(qForm.optionsText);
      const correctOptionIndex = Number(qForm.correctOption) - 1;
      if (options.length < 2) throw new Error('Enter at least 2 options (one per line)');
      if (correctOptionIndex < 0 || correctOptionIndex >= options.length) throw new Error(`Correct option must be between 1 and ${options.length}`);
      const payload = {
        questionText: qForm.questionText,
        options,
        correctOptionIndex,
        topic: qForm.topic,
        explanation: qForm.explanation,
        order: editingQuestion ? editingQuestion.order : questions.length
      };
      const url = editingQuestion
        ? `/api/admin/quizzes/${activeQuiz._id}/questions/${editingQuestion._id}`
        : `/api/admin/quizzes/${activeQuiz._id}/questions`;
      const response = await fetch(url, {
        method: editingQuestion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save question');
      setShowQModal(false); openQuestions(activeQuiz); fetchQuizzes();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete question?')) return;
    try {
      const response = await fetch(`/api/admin/quizzes/${activeQuiz._id}/questions/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to delete');
      openQuestions(activeQuiz); fetchQuizzes();
    } catch (err) { setError(err.message); }
  };

  const handleMoveQuestion = async (index, direction) => {
    const other = index + direction;
    if (other < 0 || other >= questions.length) return;
    const a = questions[index], b = questions[other];
    try {
      const response = await fetch(`/api/admin/quizzes/${activeQuiz._id}/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ questions: [
          { questionId: a._id, order: b.order },
          { questionId: b._id, order: a.order }
        ] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reorder');
      setQuestions(data.questions);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="container admin-page"><div className="loading-state"><div className="spinner" /><span>Loading…</span></div></div>;

  return (
    <div className="container">
      <div className="pp-hero">
        <p className="pp-eyebrow">Admin</p>
        <h1 className="pp-title">Manage Quizzes</h1>
        <p className="pp-sub"><Link to="/admin" className="adm-back-link">← Back to Dashboard</Link></p>
      </div>

      <div className="pp-toolbar" style={{ justifyContent: 'space-between' }}>
        <span className="pp-count">{quizzes.length} quizzes</span>
        <button className="btn btn-primary" onClick={handleCreateQuiz}>+ New Quiz</button>
      </div>

      {error && <div className="adm-error">⚠️ {error}</div>}

      <div className="pp-panel adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Title & Topic</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Questions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map(quiz => (
              <tr key={quiz._id} style={activeQuiz?._id === quiz._id ? { background: 'var(--pp-panel-hover)' } : undefined}>
                <td>
                  <div className="adm-cell-title">{quiz.title}</div>
                  <div className="adm-cell-sub">{quiz.topic}{quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ''}</div>
                </td>
                <td>{quiz.subject?.name}</td>
                <td><span className="pp-tag pp-tag-coral">{quiz.difficulty}</span></td>
                <td><span className="pp-tag pp-tag-grey">{quiz.questionCount || 0}</span></td>
                <td>
                  <div className="adm-table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openQuestions(quiz)}>Questions</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEditQuiz(quiz)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(quiz._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {quizzes.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No quizzes found.</td></tr>}
          </tbody>
        </table>
      </div>

      {activeQuiz && (
        <>
          <div className="pp-toolbar" style={{ justifyContent: 'space-between', marginTop: '28px' }}>
            <span className="pp-count">Questions for “{activeQuiz.title}” ({questions.length})</span>
            <button className="btn btn-primary" onClick={handleCreateQuestion}>+ New Question</button>
          </div>
          <div className="pp-panel adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Question</th>
                  <th>Correct Answer</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q._id}>
                    <td><span className="pp-tag pp-tag-grey">{i + 1}</span></td>
                    <td>
                      <div className="adm-cell-title">{q.questionText}</div>
                      <div className="adm-cell-sub">{(q.options || []).length} options · {q.topic}</div>
                    </td>
                    <td>{q.options?.[q.correctOptionIndex]}</td>
                    <td>
                      <div className="adm-table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleMoveQuestion(i, -1)} disabled={i === 0} title="Move up">↑</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleMoveQuestion(i, 1)} disabled={i === questions.length - 1} title="Move down">↓</button>
                      </div>
                    </td>
                    <td>
                      <div className="adm-table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditQuestion(q)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No questions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showQuizModal && (
        <div className="adm-overlay" onClick={() => setShowQuizModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuiz ? 'Edit Quiz' : 'New Quiz'}</h2>
            <form onSubmit={handleQuizSubmit}>
              <div className="adm-form-group">
                <label>Title</label>
                <input type="text" value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} required className="form-control" />
              </div>
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label>Topic</label>
                  <input type="text" value={quizForm.topic} onChange={e => setQuizForm({...quizForm, topic: e.target.value})} required className="form-control" />
                </div>
                <div className="adm-form-group">
                  <label>Subject</label>
                  <select value={quizForm.subject} onChange={e => setQuizForm({...quizForm, subject: e.target.value})} required className="form-control">
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label>Difficulty</label>
                  <select value={quizForm.difficulty} onChange={e => setQuizForm({...quizForm, difficulty: e.target.value})} className="form-control">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Time Limit (minutes, optional)</label>
                  <input type="number" min="1" value={quizForm.timeLimitMinutes} onChange={e => setQuizForm({...quizForm, timeLimitMinutes: e.target.value})} className="form-control" placeholder="No limit" />
                </div>
              </div>
              <div className="adm-form-group">
                <label>Description</label>
                <textarea value={quizForm.description} onChange={e => setQuizForm({...quizForm, description: e.target.value})} className="form-control" rows="3" />
              </div>
              <div className="adm-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuizModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Quiz'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQModal && (
        <div className="adm-overlay" onClick={() => setShowQModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuestion ? 'Edit Question' : 'New Question'}</h2>
            <form onSubmit={handleQuestionSubmit}>
              <div className="adm-form-group">
                <label>Question</label>
                <textarea value={qForm.questionText} onChange={e => setQForm({...qForm, questionText: e.target.value})} required className="form-control" rows="3" />
              </div>
              <div className="adm-form-group">
                <label>Options (one per line, at least 2)</label>
                <textarea value={qForm.optionsText} onChange={e => setQForm({...qForm, optionsText: e.target.value})} required className="form-control" rows="4" placeholder={'Option A\nOption B\nOption C'} />
              </div>
              <div className="adm-form-grid">
                <div className="adm-form-group">
                  <label>Correct Option (number)</label>
                  <input type="number" min="1" value={qForm.correctOption} onChange={e => setQForm({...qForm, correctOption: e.target.value})} required className="form-control" />
                </div>
                <div className="adm-form-group">
                  <label>Topic</label>
                  <input type="text" value={qForm.topic} onChange={e => setQForm({...qForm, topic: e.target.value})} required className="form-control" />
                </div>
              </div>
              <div className="adm-form-group">
                <label>Explanation (optional)</label>
                <textarea value={qForm.explanation} onChange={e => setQForm({...qForm, explanation: e.target.value})} className="form-control" rows="2" />
              </div>
              <div className="adm-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuizzes;
