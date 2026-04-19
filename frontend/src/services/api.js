import axios from 'axios';

// Base API instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analytics endpoints
export const fetchSummary = () => api.get('/analytics/summary').then(res => res.data);
export const fetchTrends = (days = 7) => api.get(`/trends?days=${days}`).then(res => res.data);
export const fetchInsights = (days = 30) => api.get(`/insights?days=${days}`).then(res => res.data);

// Search endpoint
export const searchArticles = ({ query, page = 1, pageSize = 10, sentiment }) => {
  const params = { q: query, page, page_size: pageSize };
  if (sentiment && sentiment !== 'all') {
    params.sentiment = sentiment;
  }
  return api.get('/search', { params }).then(res => res.data);
};

// Ingest endpoint
export const triggerIngest = (query, category, pageSize = 20) => {
  return api.post('/ingest', { query, category, page_size: pageSize }).then(res => res.data);
};

export default api;
