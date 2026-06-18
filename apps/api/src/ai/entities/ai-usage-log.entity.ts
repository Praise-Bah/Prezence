import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ schema: 'public', name: 'ai_usage_logs' })
export class AiUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column()
  model!: string;

  @Column()
  feature!: string;

  @Column({ name: 'prompt_tokens', default: 0 })
  promptTokens!: number;

  @Column({ name: 'completion_tokens', default: 0 })
  completionTokens!: number;

  @Column({ name: 'total_tokens', default: 0 })
  totalTokens!: number;

  @Column({
    name: 'estimated_cost_usd',
    type: 'numeric',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  estimatedCostUsd!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
