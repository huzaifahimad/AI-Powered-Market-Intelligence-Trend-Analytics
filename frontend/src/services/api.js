import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mi_token');
      localStorage.removeItem('mi_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signup = (name, email, password) =>
  api.post('/auth/signup', { name, email, password }).then((r) => r.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchSummary = () => api.get('/analytics/summary').then((r) => r.data);
export const fetchTrends = (days = 7) => api.get(`/trends?days=${days}`).then((r) => r.data);
export const fetchInsights = (days = 30) => api.get(`/insights?days=${days}`).then((r) => r.data);

// ── Search ────────────────────────────────────────────────────────────────────
export const searchArticles = ({ query, page = 1, pageSize = 10, sentiment }) => {
  const params = { q: query, page, page_size: pageSize };
  if (sentiment && sentiment !== 'all') params.sentiment = sentiment;
  return api.get('/search', { params }).then((r) => r.data);
};

// ── Ingest ────────────────────────────────────────────────────────────────────
export const triggerIngest = (query, category, pageSize = 20) =>
  api.post('/ingest', { query, category, page_size: pageSize }).then((r) => r.data);

// ── Health ────────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health').then((r) => r.data);

export default api;
