import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  PaymentMethod,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prezence/types';

@Entity({ name: 'subscription_requests' })
export class SubscriptionRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: ['free', 'professional', 'elite'] })
  plan!: SubscriptionPlan;

  @Column({ name: 'amount_xaf', type: 'int' })
  amountXaf!: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: ['mtn_momo', 'orange_money', 'flutterwave', 'paystack', 'stripe'],
  })
  paymentMethod!: PaymentMethod;

  @Column({ name: 'payment_reference', length: 20 })
  paymentReference!: string;

  @Column({ name: 'screenshot_url', type: 'text', nullable: true })
  screenshotUrl!: string | null;

  @Column({ name: 'transaction_id_extracted', type: 'text', nullable: true })
  transactionRef!: string | null;

  @Column({ name: 'ai_screening_result', type: 'jsonb', nullable: true })
  aiScreeningResult!: Record<string, unknown> | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: [
      'pending_ai_review',
      'provisional',
      'confirmed',
      'active',
      'past_due',
      'rejected',
      'cancelled',
    ],
    default: 'pending_ai_review',
  })
  status!: SubscriptionStatus;

  @Column({ name: 'screened_by_ai', default: false })
  screenedByAi!: boolean;

  @Column({ name: 'ai_confidence', type: 'int', nullable: true })
  aiConfidence!: number | null;

  @Column({ name: 'ai_confidence_level', type: 'text', nullable: true })
  aiConfidenceLevel!: string | null;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes!: string | null;

  @Column({
    name: 'provider_event_id',
    type: 'text',
    nullable: true,
    unique: true,
  })
  providerEventId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
