import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { AiModule } from '../ai';
import { EventsModule } from '../events';
import { NotificationModule } from '../notification';
import { RedisModule } from '../redis';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { ContentGenerationProcessor } from './jobs/content-generation.processor';
import { MarketScoreProcessor } from './jobs/market-score.processor';
import { AiEmbedding } from './entities/ai-embedding.entity';
import { InterviewResponse } from './entities/interview-response.entity';
import { MarketScore } from './entities/market-score.entity';
import { ProfileData } from './entities/profile-data.entity';
import { EmbeddingService } from './services/embedding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiEmbedding,
      InterviewResponse,
      MarketScore,
      ProfileData,
    ]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.content_generation },
      { name: QUEUE_NAMES.mfs_compute },
    ),
    RedisModule,
    AiModule,
    EventsModule,
    NotificationModule,
  ],
  controllers: [IntelligenceController],
  providers: [
    IntelligenceService,
    EmbeddingService,
    ContentGenerationProcessor,
    MarketScoreProcessor,
  ],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
