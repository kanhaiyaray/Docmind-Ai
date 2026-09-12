import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  // NO default Content-Type here — axios sets it per request:
  //   - 'application/json' for plain objects
  //   - 'multipart/form-data' (with boundary) for FormData
  withCredentials: true,
  timeout: 30000,
});

let csrfToken = null;
let csrfTokenPromise = null;

const fetchCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = (async () => {
    try {
      const response = await axios.get(`${API_URL}/csrf-token`, {
        withCredentials: true,
      });
      csrfToken = response.data.csrfToken;
      return csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
};

api.interceptors.request.use(
  async (config) => {
    const url = config.url || '';
    const skipCsrf =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/csrf-token') ||
      config.method === 'get' ||
      config.method === 'options';

    if (!skipCsrf && config.method !== 'get') {
      try {
        const token = await fetchCsrfToken();
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = token;
      } catch (error) {
        console.error('Failed to add CSRF token:', error);
      }
    }

    console.log(`📡 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('❌ API Error Details:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Server connection error.');
      return Promise.reject({
        response: {
          status: 503,
          data: {
            success: false,
            message:
              'Cannot connect to server. Please check if the backend is running.',
          },
        },
      });
    }

    if (error.response?.status === 401) {
      if (error.config?.url?.includes('/auth/login')) {
        console.log('❌ Login failed: Invalid credentials');
        return Promise.reject(error);
      }

      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        console.log('🔄 Token expired, attempting to refresh...');
        try {
          const refreshResponse = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          if (refreshResponse.data.success) {
            console.log('✅ Token refreshed successfully');
            const originalRequest = error.config;
            if (originalRequest.headers) {
              delete originalRequest.headers['X-CSRF-Token'];
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed');
          csrfToken = null;
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      console.error('❌ Unauthorized - clearing session');
      csrfToken = null;
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const clearCsrfToken = () => {
  csrfToken = null;
  csrfTokenPromise = null;
};

export const refreshCsrfToken = () => {
  csrfToken = null;
  csrfTokenPromise = null;
  return fetchCsrfToken();
};

export default api;
