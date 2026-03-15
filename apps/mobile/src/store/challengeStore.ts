import { create } from 'zustand';
import type { Challenge, ChallengeStatus } from '@financial-advisor/shared';
import api from '../services/api';

interface ChallengeState {
  active: Challenge | null;
  past: Challenge[];
  loading: boolean;
  fetchChallenges: () => Promise<void>;
  generateChallenge: () => Promise<void>;
  updateStatus: (id: string, status: ChallengeStatus) => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>()((set) => ({
  active: null,
  past: [],
  loading: false,

  fetchChallenges: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<Challenge[]>('/challenges');
      const active = data.find((c) => c.status === 'ACTIVE') ?? null;
      const past   = data.filter((c) => c.status !== 'ACTIVE');
      set({ active, past, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  generateChallenge: async () => {
    set({ loading: true });
    try {
      const { data } = await api.post<Challenge>('/challenges/generate');
      set((s) => ({ active: data, past: s.past, loading: false }));
    } catch {
      set({ loading: false });
    }
  },

  updateStatus: async (id, status) => {
    const { data } = await api.patch<Challenge>(`/challenges/${id}/status`, { status });
    set((s) => ({
      active: status === 'ACTIVE' ? data : null,
      past: status !== 'ACTIVE' ? [data, ...s.past] : s.past,
    }));
  },
}));
