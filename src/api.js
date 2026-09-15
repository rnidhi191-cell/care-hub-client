import axios from 'axios';

// Central API client. Change VITE_API_URL when the server is deployed elsewhere.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careHubToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;