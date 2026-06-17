import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  ConnectionStatus,
  IntegrationLayer,
  SupportedPlatform,
} from '@prezence/types';

@Entity('platform_connections')
@Index('platform_connections_user_platform_idx', ['userId', 'platform'], {
  unique: true,
})
export class PlatformConnection {
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

  @Column({ name: 'access_token_ciphertext' })
  accessTokenCiphertext!: string;

  @Column({ name: 'access_token_iv' })
  accessTokenIv!: string;

  @Column({ name: 'access_token_tag' })
  accessTokenTag!: string;

  @Column({ name: 'refresh_token_ciphertext', nullable: true, type: 'text' })
  refreshTokenCiphertext!: string | null;

  @Column({ name: 'refresh_token_iv', nullable: true, type: 'text' })
  refreshTokenIv!: string | null;

  @Column({ name: 'refresh_token_tag', nullable: true, type: 'text' })
  refreshTokenTag!: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  scopes!: string[];

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'revoked', 'error'],
    enumName: 'connection_status',
    default: 'active',
  })
  status!: ConnectionStatus;

  @Column({ name: 'connected_at', type: 'timestamptz', default: () => 'NOW()' })
  connectedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
