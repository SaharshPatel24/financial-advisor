import { create } from 'zustand';
import type { Insight } from '@financial-advisor/shared';
import api from '../services/api';

interface InsightState {
  weeklyInsight: Insight | null;
  loading: boolean;
  fetchWeeklyInsight: () => Promise<void>;
}

export const useInsightStore = create<InsightState>()((set) => ({
  weeklyInsight: null,
  loading: false,

  fetchWeeklyInsight: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<Insight>('/insights/weekly');
      set({ weeklyInsight: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
