// ---------------------------------------------------------------------------
// Challenge Types
// Weekly AI-generated spending challenge shown on the Challenge screen.
// ---------------------------------------------------------------------------

export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface Challenge {
  id: string;
  userId: string;
  /** Plain-text challenge description, e.g. "Spend less than $50 on dining out this week." */
  description: string;
  weekStart: string; // ISO-8601
  weekEnd: string;   // ISO-8601
  status: ChallengeStatus;
  createdAt: string;
}
