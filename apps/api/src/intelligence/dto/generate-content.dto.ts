import { IsIn, IsObject, IsString } from 'class-validator';
import type { InterviewAnswers, SupportedPlatform } from '@prezence/types';

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

export class GenerateContentDto {
  @IsIn(SUPPORTED_PLATFORMS)
  platform!: SupportedPlatform;

  @IsObject()
  answers!: InterviewAnswers;

  @IsString()
  @IsIn(['en', 'fr', 'camfranglais'])
  language: 'en' | 'fr' | 'camfranglais' = 'en';
}
