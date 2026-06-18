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
    // Merge context into the single system message — some LLM providers
    // reject or silently drop multiple system-role entries.
    const systemContent = params.context
      ? `${SYSTEM_PROMPT}\n\nUser context: ${params.context}`
      : SYSTEM_PROMPT;

    const result = await this.aiUsage.generate({
      task: 'generation',
      userId: params.userId,
      feature: 'ai-chat',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: params.message },
      ],
      options: { max_tokens: 1024 },
    });

    return {
      reply: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    };
  }
}
