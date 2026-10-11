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

  const detectTimeZone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return null;
    }
  };

  const handleSignIn = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    let user = response.data.user;
    // Backfill timezone for accounts created before the field existed, or
    // where it was never set explicitly (schema default is 'UTC').
    const detectedTz = detectTimeZone();
    if (detectedTz && (!user.timezone || user.timezone === 'UTC') && detectedTz !== user.timezone) {
      try {
        setAuthToken(response.data.token);
        await api.patch('/users/me/timezone', { timezone: detectedTz });
        user = { ...user, timezone: detectedTz };
      } catch (e) {
        console.error('Error backfilling timezone:', e);
      }
    }
    persistSession(response.data.token, user);
  };

  const handleSignUp = async (name, email, password) => {
    const detectedTz = detectTimeZone();
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      ...(detectedTz ? { timezone: detectedTz } : {}),
    });
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
