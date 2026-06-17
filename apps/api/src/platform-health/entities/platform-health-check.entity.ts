import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { SupportedPlatform } from '@prezence/types';

export type HealthStatus =
  | 'healthy'
  | 'degraded'
  | 'unreachable'
  | 'token_expired';

@Entity('platform_health_checks')
@Index('phc_user_platform_idx', ['userId', 'platform'])
@Index('phc_checked_at_idx', ['checkedAt'])
export class PlatformHealthCheck {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: [
      'linkedin',
      'github',
      'instagram',
      'facebook',
      'fiverr',
      'freelancer',
      'tiktok',
      'twitter',
    ],
    enumName: 'supported_platform',
  })
  platform!: SupportedPlatform;

  @Column({
    type: 'enum',
    enum: ['healthy', 'degraded', 'unreachable', 'token_expired'],
    default: 'healthy',
  })
  status!: HealthStatus;

  @Column({ name: 'response_ms', type: 'integer', nullable: true })
  responseMs!: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'checked_at', type: 'timestamptz' })
  checkedAt!: Date;
}
