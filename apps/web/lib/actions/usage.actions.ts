'use server';

import { api, ApiError } from '../api';

export interface ModelBreakdown {
  model: string;
  requests: number;
  totalTokens: number;
  costUsd: number | null;
}

export interface FeatureBreakdown {
  feature: string;
  requests: number;
  totalTokens: number;
}

export interface UserUsageSummary {
  periodDays: number;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number | null;
  byModel: ModelBreakdown[];
  byFeature: FeatureBreakdown[];
}

export interface DayBreakdown {
  date: string;
  requests: number;
  totalTokens: number;
}

export interface TopUser {
  userId: string;
  requests: number;
  totalTokens: number;
}

export interface SystemUsageSummary {
  periodDays: number;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number | null;
  byModel: ModelBreakdown[];
  byDay: DayBreakdown[];
  topUsers: TopUser[];
}

export async function getUserUsageAction(
  days = 30,
): Promise<UserUsageSummary | { error: string }> {
  try {
    return await api.get<UserUsageSummary>(`/ai/usage?days=${days}`);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to load usage data.' };
  }
}

export async function getSystemUsageAction(
  days = 30,
): Promise<SystemUsageSummary | { error: string }> {
  try {
    return await api.get<SystemUsageSummary>(`/ai/usage/admin?days=${days}`);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to load system usage data.' };
  }
}
