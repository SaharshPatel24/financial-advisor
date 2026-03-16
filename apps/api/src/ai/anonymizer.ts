import type {
  CreateGoalDto,
  Transaction,
  TransactionType,
} from '@financial-advisor/shared';

export interface AnonTransaction {
  amount: number;
  type: TransactionType;
  category: string;
  month: string; // "YYYY-MM" only
}

export interface AnonGoal {
  description: string;
  targetAmount: number;
  deadline?: string; // "YYYY-MM" only
}

export function anonTransactions(txs: Transaction[]): AnonTransaction[] {
  return txs.map((t) => ({
    amount: t.amount,
    type: t.type,
    category: t.category,
    month: toYearMonth(t.date),
  }));
}

export function anonGoal(goal: CreateGoalDto): AnonGoal {
  const anon: AnonGoal = {
    description: scrubDescription(goal.description),
    targetAmount: goal.targetAmount,
  };
  if (goal.deadline) {
    anon.deadline = toYearMonth(goal.deadline);
  }
  return anon;
}

export function scrubDescription(description: string): string {
  // Remove possessives like "John's" or "Sarah's"
  let result = description.replace(/\b[A-Z][a-z]+'s\b/g, '');
  // Remove standalone capitalized names (2+ chars, not all-caps abbreviations)
  result = result.replace(/\b[A-Z][a-z]{1,}\b/g, '');
  // Collapse extra whitespace
  result = result.replace(/\s+/g, ' ').trim();
  return result || 'Transaction';
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function toYearMonth(isoDate: string | Date): string {
  return new Date(isoDate).toISOString().slice(0, 7); // → "YYYY-MM"
}
