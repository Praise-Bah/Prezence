import { IsDateString, IsIn } from 'class-validator';
import type { SupportedPlatform } from '@prezence/types';

const SUPPORTED_PLATFORMS = [
  'linkedin',
  'github',
  'instagram',
  'facebook',
  'fiverr',
  'freelancer',
  'tiktok',
  'twitter',
] as const;

export class SchedulePostDto {
  @IsIn(SUPPORTED_PLATFORMS)
  platform!: SupportedPlatform;

  @IsDateString()
  scheduledAt!: string;
}
