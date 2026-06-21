import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { AiModule } from '../ai';
import { EventsModule } from '../events';
import { SharedModule } from '../shared';
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
import { UserEditSignal } from './entities/user-edit-signal.entity';
import { PlatformKnowledge } from './entities/platform-knowledge.entity';
import { EmbeddingCronService } from './jobs/embedding-cron.service';
import { VoiceLearningWorker } from './jobs/voice-learning.worker';
import { EditSignalService } from './services/edit-signal.service';
import { EmbeddingService } from './services/embedding.service';
import { PlatformKnowledgeService } from './services/platform-knowledge.service';
import { MarketSignalService } from './market-signal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiEmbedding,
      InterviewResponse,
      MarketScore,
      ProfileData,
      UserEditSignal,
      PlatformKnowledge,
    ]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.content_generation },
      { name: QUEUE_NAMES.mfs_compute },
    ),
    RedisModule,
    SharedModule,
    AiModule,
    EventsModule,
    NotificationModule,
  ],
  controllers: [IntelligenceController],
  providers: [
    IntelligenceService,
    EmbeddingService,
    EditSignalService,
    PlatformKnowledgeService,
    MarketSignalService,
    EmbeddingCronService,
    VoiceLearningWorker,
    ContentGenerationProcessor,
    MarketScoreProcessor,
  ],
  exports: [IntelligenceService, EditSignalService, PlatformKnowledgeService],
})
export class IntelligenceModule {}
