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
    enum: ['free', 'professional', 'elite'],
    default: 'free',
  })
  plan!: SubscriptionPlan;

  @Column({ name: 'country_code', type: 'text', nullable: true, default: null })
  countryCode!: string | null;

  @Column({ type: 'enum', enum: ['en', 'fr', 'camfranglais'], default: 'en' })
  language!: 'en' | 'fr' | 'camfranglais';

  @Column({ nullable: true, default: null })
  name!: string | null;

  @Column({ nullable: true, default: null })
  bio!: string | null;

  @Column({ nullable: true, default: null })
  location!: string | null;

  @Column({ nullable: true, name: 'timezone', default: 'Africa/Douala' })
  timezone!: string | null;

  @Column({ name: 'email_notifications', default: true })
  emailNotifications!: boolean;

  @Column({ name: 'push_notifications', default: true })
  pushNotifications!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  deletedAt!: Date | null;
}
