import { IsIn } from 'class-validator';
import type { ChallengeStatus } from '@financial-advisor/shared';

export class UpdateChallengeStatusDto {
  @IsIn(['ACTIVE', 'COMPLETED', 'FAILED'])
  status: ChallengeStatus;
}
