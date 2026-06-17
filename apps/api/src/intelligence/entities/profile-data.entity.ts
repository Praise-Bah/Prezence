import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { SupportedPlatform } from '@prezence/types';

@Entity({ schema: 'public', name: 'profile_data' })
export class ProfileData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  platform!: SupportedPlatform;

  @Column({ type: 'jsonb' })
  content!: Record<string, string>;

  @Column({ name: 'interview_version', type: 'int', default: 1 })
  interviewVersion!: number;

  @Column({
    name: 'quality_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  qualityScore!: number | null;

  @Column({ name: 'generated_at', type: 'timestamptz', default: () => 'NOW()' })
  generatedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
