export class CreateGoalDto {
  description: string;
  targetAmount: number;
  /** ISO-8601 optional target date */
  deadline?: string;
}
