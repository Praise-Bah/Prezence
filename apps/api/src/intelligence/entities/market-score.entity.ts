import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { SupportedPlatform } from '@prezence/types';

@Index('market_scores_user_platform_unique_idx', ['userId', 'platform'], {
  unique: true,
})
@Entity({ schema: 'public', name: 'market_scores' })
export class MarketScore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  platform!: SupportedPlatform;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  completeness!: number;

  @Column({ name: 'keyword_density', type: 'numeric', precision: 5, scale: 2 })
  keywordDensity!: number;

  @Column({ name: 'market_demand', type: 'numeric', precision: 5, scale: 2 })
  marketDemand!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  recency!: number;

  @Column({ type: 'text', array: true, default: '{}' })
  recommendations!: string[];

  @Column({ name: 'computed_at', type: 'timestamptz', default: () => 'NOW()' })
  computedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
