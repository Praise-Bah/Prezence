import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { NotificationModule } from '../notification';
import { RedisModule } from '../redis';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { ContentGenerationProcessor } from './jobs/content-generation.processor';
import { AiEmbedding } from './entities/ai-embedding.entity';
import { InterviewResponse } from './entities/interview-response.entity';
import { MarketScore } from './entities/market-score.entity';
import { ProfileData } from './entities/profile-data.entity';
import { PromptRegistry } from './entities/prompt-registry.entity';
import { EmbeddingService } from './services/embedding.service';
import { ModelRouterService } from './services/model-router.service';
import { PromptRegistryService } from './services/prompt-registry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiEmbedding,
      InterviewResponse,
      MarketScore,
      ProfileData,
      PromptRegistry,
    ]),
    BullModule.registerQueue({ name: QUEUE_NAMES.content_generation }),
    RedisModule,
    NotificationModule,
  ],
  controllers: [IntelligenceController],
  providers: [
    IntelligenceService,
    ModelRouterService,
    PromptRegistryService,
    EmbeddingService,
    ContentGenerationProcessor,
  ],
  exports: [IntelligenceService, ModelRouterService],
})
export class IntelligenceModule {}
