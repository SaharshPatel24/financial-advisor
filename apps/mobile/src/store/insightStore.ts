import { create } from 'zustand';
import type { Insight } from '@financial-advisor/shared';

// TODO(Issue #15): Add fetch weekly/monthly insight actions
interface InsightState {
  weeklyInsight: Insight | null;
}

export const useInsightStore = create<InsightState>()(() => ({
  weeklyInsight: null,
}));
