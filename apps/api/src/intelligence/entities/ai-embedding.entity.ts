import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ schema: 'public', name: 'ai_embeddings' })
export class AiEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'source_type' })
  sourceType!: string;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @Column({ name: 'model_used', nullable: true })
  modelUsed!: string | null;

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
