import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type KnowledgeCategory =
  | 'best_practices'
  | 'seo_tips'
  | 'audience_insights'
  | 'character_limits'
  | 'general';

@Index('platform_knowledge_platform_idx', ['platform'])
@Entity({ schema: 'public', name: 'platform_knowledge' })
export class PlatformKnowledge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true })
  platform!: string | null;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', default: 'general' })
  category!: KnowledgeCategory;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
