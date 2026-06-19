import { Injectable } from '@nestjs/common';
import { AiUsageService } from './ai-usage.service';
import { ChatHistoryService } from './chat-history.service';

const SYSTEM_PROMPT = `You are Prezence AI, a personal branding assistant for professionals in Cameroon and sub-Saharan Africa. You help users craft compelling profiles on LinkedIn, GitHub, Fiverr, Upwork, Instagram, Twitter, and other platforms to improve their career visibility and freelance opportunities. Give specific, actionable advice tailored to the African tech and creative market. Be encouraging and concise.`;

@Injectable()
export class ChatService {
  constructor(
    private readonly aiUsage: AiUsageService,
    private readonly chatHistory: ChatHistoryService,
  ) {}

  async chat(params: {
    message: string;
    context?: string;
    platform?: string;
    userId?: string;
  }): Promise<{
    reply: string;
    sessionId: string | null;
    promptTokens: number;
    completionTokens: number;
  }> {
    const platform = params.platform ?? 'general';

    const systemContent = params.context
      ? `${SYSTEM_PROMPT}\n\nUser context: ${params.context}`
      : SYSTEM_PROMPT;

    // Resolve or create session before calling AI so sessionId is available
    // even if the AI call fails — caller gets it back for history navigation.
    let sessionId: string | null = null;
    if (params.userId) {
      const session = await this.chatHistory.findOrCreateSession(
        params.userId,
        platform,
      );
      sessionId = session.id;
      await this.chatHistory.saveMessage(sessionId, 'user', params.message);
    }

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

    if (sessionId) {
      await this.chatHistory.saveMessage(
        sessionId,
        'assistant',
        result.content,
        result.totalTokens,
      );
    }

    return {
      reply: result.content,
      sessionId,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    };
  }
}
