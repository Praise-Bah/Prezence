import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

export type ImagePurpose = 'avatar' | 'screenshot' | 'proof' | 'document';

export interface ImageVariants {
  avif?: Record<string, string>;
  webp?: Record<string, string>;
  jpeg?: Record<string, string>;
}

@Entity('images')
@Index('images_user_id_idx', ['userId'])
@Index('images_purpose_idx', ['purpose'])
export class ImageRecord {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'original_key' })
  originalKey!: string;

  @Column({ name: 'base_url' })
  baseUrl!: string;

  @Column({ type: 'jsonb', default: '{}' })
  variants!: ImageVariants;

  @Column({ nullable: true, type: 'int' })
  width!: number | null;

  @Column({ nullable: true, type: 'int' })
  height!: number | null;

  @Column({ name: 'mime_type' })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({
    type: 'text',
  })
  purpose!: ImagePurpose;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
