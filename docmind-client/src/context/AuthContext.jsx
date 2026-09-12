import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { clearCsrfToken, refreshCsrfToken } from '../services/api';

const AuthContext = createContext();

const isDev = import.meta.env.DEV;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem('user');
      }
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (err) {
      if (isDev) console.error('Token verification failed:', err);
      localStorage.removeItem('user');
      setUser(null);

      if (
        err.response?.status === 401 &&
        err.response?.data?.code === 'TOKEN_EXPIRED'
      ) {
        try {
          await api.post('/auth/refresh', {});
          const retryResponse = await api.get('/auth/me');
          setUser(retryResponse.data.user);
          localStorage.setItem('user', JSON.stringify(retryResponse.data.user));
        } catch (refreshError) {
          if (isDev) console.error('Refresh failed:', refreshError);
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      if (isDev) console.log('🔐 Attempting login');

      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (isDev) console.log('✅ Login successful');

      const { user: loggedIn } = response.data;

      localStorage.setItem('user', JSON.stringify(loggedIn));
      setUser(loggedIn);

      await refreshCsrfToken();
      await new Promise((resolve) => setTimeout(resolve, 100));

      return { success: true };
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';

      if (err.response) {
        const code = err.response.data?.code;
        errorMessage =
          err.response.data?.message ||
          err.response.data?.error ||
          'Invalid email or password';

        if (code === 'ACCOUNT_LOCKED') {
          errorMessage =
            err.response.data.message ||
            'Account locked due to too many failed attempts. Try again later.';
        }
        if (code === 'EMAIL_NOT_VERIFIED') {
          errorMessage =
            err.response.data.message ||
            'Please verify your email before logging in.';
        }

        if (isDev) console.log('📝 Login error:', errorMessage);
      } else if (err.request) {
        errorMessage =
          'No response from server. Please check your connection.';
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      const { user: newUser } = response.data;

      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      await refreshCsrfToken();

      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      if (isDev) console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      clearCsrfToken();
    }
  };

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (err) {
      if (isDev) console.error('Logout all error:', err);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      clearCsrfToken();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    logoutAll,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
