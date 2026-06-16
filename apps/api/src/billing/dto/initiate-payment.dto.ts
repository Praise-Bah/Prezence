import { IsIn } from 'class-validator';
import type { PaymentMethod, SubscriptionPlan } from '@prezence/types';

export class InitiatePaymentDto {
  @IsIn(['starter', 'professional', 'elite'])
  plan!: Exclude<SubscriptionPlan, 'free'>;

  @IsIn(['mtn_momo', 'orange_money'])
  paymentMethod!: Extract<PaymentMethod, 'mtn_momo' | 'orange_money'>;
}
