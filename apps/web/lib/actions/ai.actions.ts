'use server';

import { api, ApiError } from '../api';

export interface ChatResponse {
  reply: string;
  sessionId: string | null;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface HistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokensUsed: number;
  createdAt: string;
}

export async function sendChatMessage(
  message: string,
  context?: string,
  platform = 'general',
): Promise<ChatResponse | { error: string }> {
  try {
    return await api.post<ChatResponse>('/ai/chat', { message, context, platform });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: 'AI is unavailable right now. Try again.' };
    }
    return { error: 'AI is unavailable right now. Try again.' };
  }
}

export async function getChatHistory(
  platform = 'general',
  limit = 50,
): Promise<HistoryMessage[]> {
  try {
    const data = await api.get<{ messages: HistoryMessage[] }>(
      `/ai/chat/history?platform=${encodeURIComponent(platform)}&limit=${limit}`,
    );
    return data.messages;
  } catch {
    return [];
  }
}
