import { create } from 'zustand';
import type { AuthUser, AuthTokens } from '@financial-advisor/shared';

// TODO(Issue #13): Add login, register, logout actions
interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(() => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
}));
