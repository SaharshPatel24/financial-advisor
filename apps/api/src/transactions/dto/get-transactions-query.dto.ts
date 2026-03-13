import type {
  TransactionCategory,
  TransactionType,
} from '@financial-advisor/shared';

export class GetTransactionsQueryDto {
  type?: TransactionType;
  category?: TransactionCategory;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
