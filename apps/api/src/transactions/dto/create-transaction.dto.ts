import type {
  TransactionCategory,
  TransactionType,
} from '@financial-advisor/shared';

export class CreateTransactionDto {
  description: string;
  amount: number;
  type: TransactionType;
  /** Optional — AI will categorize automatically when omitted */
  category?: TransactionCategory;
  /** ISO-8601 — defaults to now when omitted */
  date?: string;
}
