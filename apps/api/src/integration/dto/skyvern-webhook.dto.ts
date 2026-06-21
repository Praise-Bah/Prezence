import { IsIn, IsOptional, IsString } from 'class-validator';

export class SkyvernWebhookDto {
  @IsString()
  task_id!: string;

  @IsIn(['completed', 'failed', 'timed_out'])
  status!: 'completed' | 'failed' | 'timed_out';

  @IsOptional()
  @IsString()
  screenshot_url!: string | null;

  @IsOptional()
  @IsString()
  failure_reason!: string | null;
}
