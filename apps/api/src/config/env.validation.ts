import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsNotEmpty()
  REDIS_URL!: string;

  @IsNotEmpty()
  OPENROUTER_API_KEY!: string;

  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._/-]+$/, {
    message:
      'SCREENSHOT_AI_MODEL must be a valid model identifier (e.g. anthropic/claude-sonnet-4-6)',
  })
  SCREENSHOT_AI_MODEL!: string;

  @IsNotEmpty()
  R2_ACCOUNT_ID!: string;

  @IsNotEmpty()
  R2_ACCESS_KEY_ID!: string;

  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY!: string;

  @IsNotEmpty()
  R2_BUCKET_NAME!: string;

  @IsNotEmpty()
  R2_PUBLIC_URL!: string;

  @IsNotEmpty()
  FOUNDER_MTN_NUMBER!: string;

  @IsNotEmpty()
  FOUNDER_ORANGE_NUMBER!: string;

  @IsOptional()
  RESEND_API_KEY?: string;

  @IsOptional()
  NOTIFICATIONS_FROM_EMAIL?: string;

  @IsNotEmpty()
  @Matches(/^[0-9a-fA-F]{64}$/, {
    message:
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256-GCM)',
  })
  ENCRYPTION_KEY!: string;

  @IsNotEmpty()
  SKYVERN_API_KEY!: string;

  @IsOptional()
  @IsString()
  SKYVERN_API_URL?: string;

  @IsOptional()
  @IsString()
  SMARTPROXY_HOST?: string;

  @IsOptional()
  @IsString()
  SMARTPROXY_USERNAME?: string;

  @IsOptional()
  @IsString()
  SMARTPROXY_PASSWORD?: string;

  @IsOptional()
  @IsString()
  LINKEDIN_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  LINKEDIN_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  META_APP_ID?: string;

  @IsOptional()
  @IsString()
  META_APP_SECRET?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  FACEBOOK_APP_ID?: string;

  @IsOptional()
  @IsString()
  FACEBOOK_APP_SECRET?: string;

  @IsOptional()
  @IsString()
  API_URL?: string;

  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
