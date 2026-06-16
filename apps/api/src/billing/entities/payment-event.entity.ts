import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { PaymentMethod } from '@prezence/types';

@Entity({ name: 'payment_events' })
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ name: 'subscription_request_id', nullable: true })
  subscriptionRequestId!: string | null;

  @Column({ name: 'event_type', length: 64 })
  eventType!: string;

  @Column({ name: 'amount_xaf', type: 'int', default: 0 })
  amountXaf!: number;

  @Column({ name: 'currency', length: 8, default: 'XAF' })
  currency!: string;

  @Column({
    name: 'provider',
    type: 'enum',
    enum: ['mtn_momo', 'orange_money', 'flutterwave', 'paystack', 'stripe'],
  })
  provider!: PaymentMethod;

  @Column({ name: 'provider_event_id', type: 'text', nullable: true })
  providerEventId!: string | null;

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
