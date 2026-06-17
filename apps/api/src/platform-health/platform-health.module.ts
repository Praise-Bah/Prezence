import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationModule } from '../integration';
import { RedisModule } from '../redis/redis.module';
import { GithubChecker } from './checkers/github.checker';
import { PlatformConnection } from '../integration';
import { PlatformHealthCheck } from './entities/platform-health-check.entity';
import { PlatformHealthController } from './platform-health.controller';
import { PlatformHealthService } from './platform-health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformHealthCheck, PlatformConnection]),
    IntegrationModule,
    RedisModule,
  ],
  controllers: [PlatformHealthController],
  providers: [PlatformHealthService, GithubChecker],
  exports: [PlatformHealthService],
})
export class PlatformHealthModule {}
