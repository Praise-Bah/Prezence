import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { IntegrationLayer, SupportedPlatform } from '@prezence/types';

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

const INTEGRATION_LAYERS = ['L1', 'L2', 'L3A', 'L3B'] as const;

export class ConnectPlatformDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(SUPPORTED_PLATFORMS)
  platform!: SupportedPlatform;

  @IsString()
  @IsNotEmpty()
  @IsIn(INTEGRATION_LAYERS)
  layer!: IntegrationLayer;

  @IsString()
  @IsNotEmpty()
  access_token!: string;

  @IsOptional()
  @IsString()
  refresh_token?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
