// ---------------------------------------------------------------------------
// Insight Types
// AI-generated spending analysis text returned from /insights endpoints.
// ---------------------------------------------------------------------------

export type InsightPeriod = 'weekly' | 'monthly';

export interface Insight {
  period: InsightPeriod;
  /** The AI-generated plain-text summary (2-3 sentences, actionable) */
  summary: string;
  /** ISO-8601 date range this insight covers */
  from: string;
  to: string;
  /** When this insight was generated */
  generatedAt: string;
}
