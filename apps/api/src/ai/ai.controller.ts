import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { ChatMessageDto } from './dto/chat.dto';
import { ChatService } from './services/chat.service';
import { AiUsageService } from './services/ai-usage.service';
import type {
  UserUsageSummary,
  SystemUsageSummary,
} from './services/ai-usage.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly usageService: AiUsageService,
  ) {}

  @Post('chat')
  async chat(
    @Body() dto: ChatMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    reply: string;
    usage: { prompt_tokens: number; completion_tokens: number };
  }> {
    const result = await this.chatService.chat({
      message: dto.message,
      context: dto.context,
      userId: user.userId,
    });
    return {
      reply: result.reply,
      usage: {
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
      },
    };
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
