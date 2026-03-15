import { IsIn, IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type {
  TransactionCategory,
  TransactionType,
} from '@financial-advisor/shared';

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'])
  type?: TransactionType;

  @IsOptional()
  @IsIn(['Food', 'Transport', 'Bills', 'Entertainment', 'Shopping', 'Health', 'Income', 'Other'])
  category?: TransactionCategory;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
