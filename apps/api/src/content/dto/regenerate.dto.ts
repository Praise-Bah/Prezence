import { IsIn, IsOptional, IsString } from 'class-validator';
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

export class RegenerateDto {
  @IsIn(SUPPORTED_PLATFORMS)
  platform!: SupportedPlatform;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'fr', 'camfranglais'])
  language?: 'en' | 'fr' | 'camfranglais';
}
