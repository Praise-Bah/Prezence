'use server';

import { api, ApiError } from '../api';

export interface ChatResponse {
  reply: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export async function sendChatMessage(
  message: string,
  context?: string,
): Promise<ChatResponse | { error: string }> {
  try {
    return await api.post<ChatResponse>('/ai/chat', { message, context });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: 'AI is unavailable right now. Try again.' };
    }
    return { error: 'AI is unavailable right now. Try again.' };
  }
}
