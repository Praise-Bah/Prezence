import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { ChatMessageDto, ChatHistoryQueryDto } from './dto/chat.dto';
import { ChatService } from './services/chat.service';
import { AiUsageService } from './services/ai-usage.service';
import { ChatHistoryService } from './services/chat-history.service';
import type { ChatMessage } from './entities/chat-message.entity';
import type {
  UserUsageSummary,
  SystemUsageSummary,
} from './services/ai-usage.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly usageService: AiUsageService,
    private readonly chatHistory: ChatHistoryService,
  ) {}

  @Post('chat')
  async chat(
    @Body() dto: ChatMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    reply: string;
    sessionId: string | null;
    usage: { prompt_tokens: number; completion_tokens: number };
  }> {
    const result = await this.chatService.chat({
      message: dto.message,
      context: dto.context,
      platform: dto.platform,
      userId: user.userId,
    });
    return {
      reply: result.reply,
      sessionId: result.sessionId,
      usage: {
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
      },
    };
  }

  @Get('chat/history')
  async history(
    @Query() query: ChatHistoryQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ messages: ChatMessage[] }> {
    const platform = query.platform ?? 'general';
    const limit = query.limit ?? 50;
    const messages = await this.chatHistory.getHistory(
      user.userId,
      platform,
      limit,
    );
    return { messages };
  }

  @Get('usage')
  async getUserUsage(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') daysParam?: string,
  ): Promise<UserUsageSummary> {
    const days = daysParam
      ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 90)
      : 30;
    return this.usageService.getUserUsageSummary(user.userId, days);
  }

  @Get('usage/admin')
  @Roles('system_admin', 'support')
  async getSystemUsage(
    @Query('days') daysParam?: string,
  ): Promise<SystemUsageSummary> {
    const days = daysParam
      ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 90)
      : 30;
    return this.usageService.getSystemUsageSummary(days);
  }
}
