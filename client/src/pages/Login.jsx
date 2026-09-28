import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { setAuthToken, setUser as saveUser } from '../utils/auth';
import { AuthUI } from '../components/ui/auth-ui';

function Login({ setUser }) {
  const navigate = useNavigate();

  const persistSession = (token, user) => {
    setAuthToken(token);
    saveUser(user);
    setUser(user);
    navigate('/');
  };

  const handleSignIn = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    persistSession(response.data.token, response.data.user);
  };

  const handleSignUp = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    persistSession(response.data.token, response.data.user);
  };

  return (
    <AuthUI
      initialIsSignIn
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      onToggleMode={(isSignIn) => navigate(isSignIn ? '/login' : '/register')}
    />
  );
}

export default Login;
