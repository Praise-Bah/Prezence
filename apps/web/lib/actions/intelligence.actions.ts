'use server';

import type { SupportedPlatform } from '@prezence/types';
import { api, ApiError } from '../api';

export interface InterviewState {
  error?: string;
  jobId?: string;
  platform?: string;
}

export async function submitInterviewAction(
  _prev: InterviewState,
  formData: FormData,
): Promise<InterviewState> {
  const platform = formData.get('platform') as SupportedPlatform;
  const language = (formData.get('language') as string) || 'en';

  const answers = {
    name: formData.get('name') as string,
    title: formData.get('title') as string,
    experience_years: formData.get('experience_years') as string,
    skills: formData.get('skills') as string,
    bio: formData.get('bio') as string,
    achievements: formData.get('achievements') as string,
    looking_for: formData.get('looking_for') as string,
    target_audience: formData.get('target_audience') as string,
    languages_spoken: (formData.get('languages_spoken') as string) || undefined,
  };

  const required = ['name', 'title', 'experience_years', 'skills', 'bio', 'achievements', 'looking_for', 'target_audience'];
  for (const field of required) {
    if (!answers[field as keyof typeof answers]) {
      return { error: 'Please fill in all required fields.' };
    }
  }

  try {
    const result = await api.post<{ jobId: string }>('/intelligence/generate', {
      platform,
      language,
      answers,
    });
    return { jobId: result.jobId, platform };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to submit interview. Please try again.' };
  }
}

export async function regenerateAction(
  platform: SupportedPlatform,
  language: 'en' | 'fr' | 'camfranglais' = 'en',
): Promise<{ jobId: string; message: string } | { error: string }> {
  try {
    return await api.post<{ jobId: string; message: string }>('/content/regenerate', {
      platform,
      language,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to start regeneration.' };
  }
}
