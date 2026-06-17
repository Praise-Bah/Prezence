import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { InterviewResponse } from '../intelligence/entities/interview-response.entity';
import { MarketScore } from '../intelligence/entities/market-score.entity';
import { ProfileData } from '../intelligence/entities/profile-data.entity';
import { RedisModule } from '../redis/redis.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileData, MarketScore, InterviewResponse]),
    BullModule.registerQueue({ name: QUEUE_NAMES.content_generation }),
    RedisModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
