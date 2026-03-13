import { create } from 'zustand';
import type { AuthUser, AuthTokens, AuthResponse, LoginDto, RegisterDto } from '@financial-advisor/shared';
import api from '../services/api';

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  // Actions
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  setTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  login: async (dto) => {
    const { data } = await api.post<AuthResponse>('/auth/login', dto);
    set({ user: data.user, tokens: data.tokens, isAuthenticated: true });
  },

  register: async (dto) => {
    const { data } = await api.post<AuthResponse>('/auth/register', dto);
    set({ user: data.user, tokens: data.tokens, isAuthenticated: true });
  },

  logout: () => set({ user: null, tokens: null, isAuthenticated: false }),

  setTokens: (tokens) => set({ tokens }),
}));
