import axios from 'axios';

// TODO(Issue #18): Add request interceptor to attach JWT from auth store
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
