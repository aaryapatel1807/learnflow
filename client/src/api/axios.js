import axios from 'axios';
import { getAuthToken, logout } from '../utils/auth';

const api = axios.create({
  baseURL: '/api'
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// An expired/invalid JWT should send the user back to login instead of
// leaving every page silently failing.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthCall && getAuthToken()) {
      logout();
      window.dispatchEvent(new Event('learnflow:logout'));
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
