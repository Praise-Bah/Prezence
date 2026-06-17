import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { InterviewAnswers, SupportedPlatform } from '@prezence/types';

@Entity({ schema: 'public', name: 'interview_responses' })
export class InterviewResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  platform!: SupportedPlatform;

  @Column({ name: 'interview_version', type: 'int', default: 1 })
  interviewVersion!: number;

  @Column({ type: 'jsonb' })
  answers!: InterviewAnswers;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
