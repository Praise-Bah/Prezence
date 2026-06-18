import { Injectable } from '@nestjs/common';
import { AiUsageService } from './ai-usage.service';

const SYSTEM_PROMPT = `You are Prezence AI, a personal branding assistant for professionals in Cameroon and sub-Saharan Africa. You help users craft compelling profiles on LinkedIn, GitHub, Fiverr, Upwork, Instagram, Twitter, and other platforms to improve their career visibility and freelance opportunities. Give specific, actionable advice tailored to the African tech and creative market. Be encouraging and concise.`;

@Injectable()
export class ChatService {
  constructor(private readonly aiUsage: AiUsageService) {}

  async chat(params: {
    message: string;
    context?: string;
    userId?: string;
  }): Promise<{
    reply: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (params.context) {
      messages.push({
        role: 'system',
        content: `User context: ${params.context}`,
      });
    }

    messages.push({ role: 'user', content: params.message });

    const result = await this.aiUsage.generate({
      task: 'generation',
      userId: params.userId,
      feature: 'ai-chat',
      messages,
      options: { max_tokens: 1024 },
    });

    return {
      reply: result.content,
      promptTokens: 0,
      completionTokens: result.totalTokens,
    };
  }
}
