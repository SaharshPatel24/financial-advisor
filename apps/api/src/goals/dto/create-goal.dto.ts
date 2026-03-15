import { IsISO8601, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  /** ISO-8601 optional target date */
  @IsOptional()
  @IsISO8601()
  deadline?: string;
}
