import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { ChatMessageDto } from './dto/chat.dto';
import { ChatService } from './services/chat.service';

@Controller('ai')
export class AiController {
  constructor(private readonly chatService: ChatService) {}

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
}
