import axios from 'axios';
import { getSessionToken, setSessionToken, getRefreshToken } from '@/context/AuthContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — reads the token from sessionStorage on every request
// so that each tab always attaches its own session's JWT.
// IMPORTANT: Do NOT capture the token once at module init. Re-read it on every
// request so that token refresh (below) is immediately picked up.
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = getSessionToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — handles 401 (expired access token) by trying the
// refresh-token flow. Reads and writes from sessionStorage to stay tab-local.
// On irrecoverable failure: clears only this tab's session state.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/refresh-token`, { refreshToken });
        if (res.data?.data?.accessToken) {
          // Update only this tab's sessionStorage — other tabs are unaffected.
          setSessionToken(res.data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // Clear only this tab's session. Other tabs remain authenticated.
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export async function openSecureFile(url: string, filename = 'document.pdf', download = false) {
  try {
    const targetUrl = url.startsWith('/api/v1') ? url.substring('/api/v1'.length) : url;
    const res = await api.get(targetUrl, {
      responseType: 'blob',
    });
    const contentType = (res.headers['content-type'] as string) || 'application/pdf';
    const blob = new Blob([res.data], { type: contentType });
    const objectUrl = window.URL.createObjectURL(blob);
    if (download) {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(objectUrl, '_blank');
    }
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
  } catch (err) {
    console.error('Failed to open secure file:', err);
    alert('Failed to retrieve file. You may not have permission or the session has expired.');
  }
}

export default api;
