'use server';

import { api, ApiError } from '../api';

export interface PendingSubmission {
  id: string;
  userId: string;
  userEmail: string | null;
  plan: string;
  amountXaf: number;
  paymentMethod: string;
  paymentReference: string;
  screenshotUrl: string | null;
  transactionRef: string | null;
  status: string;
  aiConfidence: number | null;
  aiConfidenceLevel: string | null;
  aiScreeningResult: Record<string, unknown> | null;
  createdAt: string;
}

export interface ReviewRequestData {
  action: 'approve' | 'reject';
  adminNotes?: string;
}

export interface ActionResult {
  error?: string;
  success?: string;
}

export async function listPendingRequestsAction(): Promise<
  PendingSubmission[] | { error: string }
> {
  try {
    return await api.get<PendingSubmission[]>('/billing/admin/queue');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return { error: 'Access denied.' };
    return { error: 'Failed to load queue.' };
  }
}

export async function reviewRequestAction(
  id: string,
  data: ReviewRequestData,
): Promise<ActionResult> {
  try {
    await api.post(`/billing/admin/${id}/review`, data);
    return {
      success: data.action === 'approve' ? 'Approved — plan upgraded.' : 'Submission rejected.',
    };
  } catch (err) {
    if (err instanceof ApiError) {
      try {
        const parsed = JSON.parse(err.message) as { message?: string };
        return { error: parsed.message ?? 'Review failed.' };
      } catch {
        return { error: 'Review failed.' };
      }
    }
    return { error: 'Could not connect to the server.' };
  }
}
