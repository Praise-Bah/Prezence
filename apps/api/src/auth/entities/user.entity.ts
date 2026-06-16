import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { SubscriptionPlan, UserRole } from '@prezence/types';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: ['user', 'institutional_admin', 'support', 'system_admin'],
    default: 'user',
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: ['free', 'starter', 'professional', 'elite'],
    default: 'free',
  })
  plan!: SubscriptionPlan;

  @Column({ name: 'country_code', default: 'CM' })
  countryCode!: string;

  @Column({ type: 'enum', enum: ['en', 'fr', 'camfranglais'], default: 'en' })
  language!: 'en' | 'fr' | 'camfranglais';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
