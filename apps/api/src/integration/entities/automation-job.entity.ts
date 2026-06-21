import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  IntegrationLayer,
  JobStatus,
  SupportedPlatform,
} from '@prezence/types';

@Entity('automation_jobs')
@Index('automation_jobs_user_id_idx', ['userId'])
@Index('automation_jobs_status_idx', ['status'])
export class AutomationJobEntity {
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
    name: 'layer_used',
    type: 'enum',
    enum: ['L1', 'L2', 'L3A', 'L3B'],
    enumName: 'integration_layer',
  })
  layerUsed!: IntegrationLayer;

  @Column({
    type: 'enum',
    enum: ['queued', 'running', 'completed', 'failed', 'retrying'],
    enumName: 'job_status',
    default: 'queued',
  })
  status!: JobStatus;

  @Column({ name: 'proof_url', nullable: true, type: 'text' })
  proofUrl!: string | null;

  @Column({ name: 'retry_count', default: 0 })
  retryCount!: number;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'skyvern_task_id', nullable: true, type: 'text' })
  skyvernTaskId!: string | null;
}
