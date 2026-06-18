'use server';

import type { SubscriptionPlan } from '@prezence/types';
import { api, ApiError } from '../api';

export interface InitPaymentResult {
  reference: string;
  amount: number;
  recipientNumber: string;
  method: string;
  requestId: string;
}

export async function initiatePaymentAction(
  plan: SubscriptionPlan,
  paymentMethod: 'mtn_momo' | 'orange_money',
): Promise<InitPaymentResult | { error: string }> {
  try {
    return await api.post<InitPaymentResult>('/billing/initiate', {
      plan,
      paymentMethod,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to initiate payment.' };
  }
}

export async function uploadScreenshotAction(
  requestId: string,
  formData: FormData,
): Promise<{ message: string } | { error: string }> {
  formData.append('requestId', requestId);
  try {
    return await api.postForm<{ message: string }>('/billing/upload-screenshot', formData);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to upload screenshot.' };
  }
}
