// ---------------------------------------------------------------------------
// Transaction Types
// Represents a single income or expense entry with AI-assigned category.
// ---------------------------------------------------------------------------

/**
 * Valid spending/income categories the AI can assign.
 * Extend this list if more granularity is needed later.
 */
export type TransactionCategory =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Entertainment'
  | 'Shopping'
  | 'Health'
  | 'Income'
  | 'Other';

export type TransactionType = 'INCOME' | 'EXPENSE';

// DTO sent by the mobile app when creating a transaction
export interface CreateTransactionDto {
  description: string;
  amount: number;
  type: TransactionType;
  /** Optional override — if omitted, AI will categorize automatically */
  category?: TransactionCategory;
  /** Optional date; defaults to now on the server */
  date?: string; // ISO-8601
}

// Full transaction object returned from the API
export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  /** 0–1 confidence score from the AI categorizer; null if user-specified */
  aiConfidence: number | null;
  date: string; // ISO-8601
  createdAt: string;
}

// Query params for GET /transactions
export interface GetTransactionsQuery {
  type?: TransactionType;
  category?: TransactionCategory;
  from?: string; // ISO-8601 date
  to?: string;   // ISO-8601 date
  page?: number;
  limit?: number;
}

// Paginated response wrapper
export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// Aggregated totals grouped by category (used by the Dashboard)
export interface TransactionSummary {
  category: TransactionCategory;
  total: number;
  count: number;
}
