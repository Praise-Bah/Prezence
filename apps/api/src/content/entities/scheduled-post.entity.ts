import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { SupportedPlatform } from '@prezence/types';

export type ScheduledPostStatus =
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed';

@Entity({ name: 'scheduled_posts' })
export class ScheduledPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  platform!: SupportedPlatform;

  @Column({ name: 'content_sections', type: 'jsonb', default: {} })
  contentSections!: Record<string, string>;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'text', default: 'scheduled' })
  status!: ScheduledPostStatus;

  @Column({ name: 'automation_job_id', type: 'uuid', nullable: true })
  automationJobId!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
