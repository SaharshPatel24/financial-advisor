import axios from 'axios';
import Constants from 'expo-constants';
import type { AuthTokens } from '@financial-advisor/shared';

/**
 * Resolve the API base URL for any run environment:
 *   - Set EXPO_PUBLIC_API_URL in .env to override explicitly (production, tunnels, etc.)
 *   - Otherwise, derive from the Expo/Metro dev-server host so it works on:
 *       • iOS Simulator   → localhost
 *       • Android Emulator → LAN IP that Metro is already using
 *       • Physical device  → LAN IP that Metro is already using
 */
function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // hostUri is e.g. "192.168.1.5:8081" or "localhost:8081"
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000/api`;
  }

  return 'http://localhost:3000/api';
}

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10 s — prevents infinite loading when server is unreachable
});

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT access token from auth store
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  // Lazy require breaks the circular import: api ↔ authStore
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('../store/authStore') as typeof import('../store/authStore');
  const tokens = useAuthStore.getState().tokens;
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — 401 → refresh token → retry original request
// ---------------------------------------------------------------------------
let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuthStore } = require('../store/authStore') as typeof import('../store/authStore');
    const { tokens, setTokens, logout } = useAuthStore.getState();

    if (!tokens?.refreshToken) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newAccessToken) => {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<AuthTokens>(`${API_URL}/auth/refresh`, {
        refreshToken: tokens.refreshToken,
      });
      setTokens(data);
      processQueue(null, data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
