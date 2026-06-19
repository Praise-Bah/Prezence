'use server';

import type { SupportedPlatform } from '@prezence/types';
import { api, ApiError } from '../api';

export type ScheduledPostStatus =
  | 'scheduled'
  | 'processing'
  | 'dispatched'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ScheduledPost {
  id: string;
  userId: string;
  platform: SupportedPlatform;
  contentSections: Record<string, string>;
  scheduledAt: string;
  status: ScheduledPostStatus;
  automationJobId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function schedulePostAction(
  platform: SupportedPlatform,
  scheduledAt: string,
): Promise<ScheduledPost | { error: string }> {
  try {
    return await api.post<ScheduledPost>('/content/schedule', { platform, scheduledAt });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to schedule post. Please try again.' };
  }
}

export async function getScheduledPostsAction(): Promise<ScheduledPost[] | { error: string }> {
  try {
    return await api.get<ScheduledPost[]>('/content/schedule');
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to load scheduled posts.' };
  }
}

export async function cancelScheduledPostAction(
  postId: string,
): Promise<{ message: string } | { error: string }> {
  try {
    return await api.delete<{ message: string }>(`/content/schedule/${postId}`);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to cancel scheduled post.' };
  }
}
