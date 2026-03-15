import { create } from 'zustand';
import type { Challenge } from '@financial-advisor/shared';

// TODO(Issue #17): Add fetch and generate challenge actions
interface ChallengeState {
  challenge: Challenge | null;
}

export const useChallengeStore = create<ChallengeState>()(() => ({
  challenge: null,
}));
