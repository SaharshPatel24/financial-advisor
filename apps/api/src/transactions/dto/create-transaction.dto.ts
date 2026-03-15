import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type {
  TransactionCategory,
  TransactionType,
} from '@financial-advisor/shared';

export class CreateTransactionDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['INCOME', 'EXPENSE'])
  type: TransactionType;

  /** Optional — AI will categorize automatically when omitted */
  @IsOptional()
  @IsIn(['Food', 'Transport', 'Bills', 'Entertainment', 'Shopping', 'Health', 'Income', 'Other'])
  category?: TransactionCategory;

  /** ISO-8601 — defaults to now when omitted */
  @IsOptional()
  @IsISO8601()
  date?: string;
}
