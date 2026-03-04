// ---------------------------------------------------------------------------
// Goal Types
// Savings goal set by the user, with an AI-generated recommendation.
// ---------------------------------------------------------------------------

// DTO for creating or updating a goal
export interface CreateGoalDto {
  description: string;
  targetAmount: number;
  /** Optional target date in ISO-8601 format */
  deadline?: string;
}

export interface Goal {
  id: string;
  userId: string;
  description: string;
  targetAmount: number;
  deadline: string | null; // ISO-8601
  /** Cached AI recommendation text; null if not yet generated */
  aiRecommendation: string | null;
  createdAt: string;
  updatedAt: string;
}
