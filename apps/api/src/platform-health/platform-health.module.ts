import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { IntegrationModule } from '../integration';
import { RedisModule } from '../redis';
import { FiverrChecker } from './checkers/fiverr.checker';
import { GithubChecker } from './checkers/github.checker';
import { LinkedInChecker } from './checkers/linkedin.checker';
import { MetaChecker } from './checkers/meta.checker';
import { PlatformConnection } from '../integration';
import { PlatformHealthCheck } from './entities/platform-health-check.entity';
import { PlatformHealthController } from './platform-health.controller';
import { PlatformHealthService } from './platform-health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformHealthCheck, PlatformConnection]),
    BullModule.registerQueue({ name: QUEUE_NAMES.automation }),
    IntegrationModule,
    RedisModule,
  ],
  controllers: [PlatformHealthController],
  providers: [
    PlatformHealthService,
    GithubChecker,
    MetaChecker,
    LinkedInChecker,
    FiverrChecker,
  ],
  exports: [PlatformHealthService],
})
export class PlatformHealthModule {}
