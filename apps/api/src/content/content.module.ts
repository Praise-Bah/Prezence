import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { AuthModule } from '../auth';
import { InterviewResponse, MarketScore, ProfileData } from '../intelligence';
import { RedisModule } from '../redis';
// AutomationJobEntity: direct path import to avoid circular barrel cycle
// (integration/index → integration.module → content/index → content.module → [integration barrel = cycle])
// Long-term fix: move entity to a SharedModule.
import { AutomationJobEntity } from '../integration/entities/automation-job.entity';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ScheduledPost } from './entities/scheduled-post.entity';
import { ScheduledPostProcessor } from './jobs/scheduled-post.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProfileData,
      MarketScore,
      InterviewResponse,
      ScheduledPost,
      AutomationJobEntity,
    ]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.content_generation },
      { name: QUEUE_NAMES.content_schedule },
      { name: QUEUE_NAMES.automation },
    ),
    RedisModule,
    AuthModule,
  ],
  controllers: [ContentController],
  providers: [ContentService, ScheduledPostProcessor],
  exports: [ContentService],
})
export class ContentModule {}
