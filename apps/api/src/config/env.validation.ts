import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
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
