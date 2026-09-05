import axios from 'axios';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor - add token and log
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Handle connection refused
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Server connection error. Please make sure the backend server is running.');
      console.error(`   API URL: ${API_URL}`);
      
      return Promise.reject({
        response: {
          status: 503,
          data: {
            success: false,
            message: 'Cannot connect to server. Please check if the backend is running on port 5000.',
          },
        },
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error('❌ Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    console.error('❌ API Error:', error.message);
    return Promise.reject(error);
  }
);

export default api;
