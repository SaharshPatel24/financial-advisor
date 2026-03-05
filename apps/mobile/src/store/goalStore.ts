import { create } from 'zustand';
import type { Goal } from '@financial-advisor/shared';

// TODO(Issue #16): Add fetch and create goal actions
interface GoalState {
  goal: Goal | null;
}

export const useGoalStore = create<GoalState>()(() => ({
  goal: null,
}));
