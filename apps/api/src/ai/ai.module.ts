import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { PromptRegistry } from './entities/prompt-registry.entity';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AiUsageService } from './services/ai-usage.service';
import { ChatService } from './services/chat.service';
import { ChatHistoryService } from './services/chat-history.service';
import { ModelRouterService } from './services/model-router.service';
import { PromptRegistryService } from './services/prompt-registry.service';
import { AiController } from './ai.controller';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      AiUsageLog,
      PromptRegistry,
      ChatSession,
      ChatMessage,
    ]),
  ],
  controllers: [AiController],
  providers: [
    ModelRouterService,
    PromptRegistryService,
    AiUsageService,
    ChatService,
    ChatHistoryService,
  ],
  exports: [AiUsageService, PromptRegistryService],
})
export class AiModule {}
