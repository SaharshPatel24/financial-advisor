import { create } from 'zustand';
import type { Goal, CreateGoalDto } from '@financial-advisor/shared';
import api from '../services/api';

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  createGoal: (dto: CreateGoalDto) => Promise<Goal>;
}

export const useGoalsStore = create<GoalsState>()((set) => ({
  goals: [],
  loading: false,

  fetchGoals: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<Goal[]>('/goals');
      set({ goals: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createGoal: async (dto) => {
    const { data } = await api.post<Goal>('/goals', dto);
    set((s) => ({ goals: [data, ...s.goals] }));
    return data;
  },
}));
