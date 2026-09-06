import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { clearCsrfToken, refreshCsrfToken } from '../services/api';

const AuthContext = createContext();

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
      setUser(JSON.parse(savedUser));
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
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('user');
      setUser(null);
      if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
        try {
          await api.post('/auth/refresh', {});
          const retryResponse = await api.get('/auth/me');
          setUser(retryResponse.data.user);
          localStorage.setItem('user', JSON.stringify(retryResponse.data.user));
        } catch (refreshError) {
          console.error('Refresh failed:', refreshError);
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
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      console.log('✅ Login response:', response.data);
      
      const { user } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      await refreshCsrfToken();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('📝 Server response:', error.response.data);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      'Invalid email or password';
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
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
        password 
      });
      const { user } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      await refreshCsrfToken();
      
      return { success: true };
    } catch (error) {
      let errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      clearCsrfToken();
    }
  };

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      clearCsrfToken();
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    logoutAll,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
