import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { setAuthToken, setUser as saveUser } from '../utils/auth';
import './Auth.css';

function Register({ setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user } = response.data;
      setAuthToken(token); saveUser(user); setUser(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Join Academix</h1>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="form-control" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="form-control" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" className="form-control" />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}

export default Register;
