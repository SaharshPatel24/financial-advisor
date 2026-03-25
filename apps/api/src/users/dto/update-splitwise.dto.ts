import { IsOptional, IsString } from 'class-validator';

export class UpdateSplitwiseDto {
  @IsOptional()
  @IsString()
  apiKey?: string | null;
}
