import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { ContentModule } from '../content';
import { EventsModule } from '../events';
import { NotificationModule } from '../notification';
import { RedisModule } from '../redis';
import { SharedModule } from '../shared';
import { PlatformConnection } from './entities/platform-connection.entity';
import { AutomationProcessor } from './jobs/automation.processor';
import { WebhookRetryProcessor } from './jobs/webhook-retry.processor';
import { OAuthService } from './services/oauth.service';
import { ProxyService } from './services/proxy.service';
import { TokenVaultService } from './services/token-vault.service';
import { FiverrStrategy } from './strategies/fiverr.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { MetaStrategy } from './strategies/meta.strategy';
import { L3aPlaywrightStrategy } from './strategies/l3a-playwright.strategy';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformConnection]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.automation },
      { name: QUEUE_NAMES.webhook_retry },
    ),
    SharedModule,
    ContentModule,
    EventsModule,
    NotificationModule,
    RedisModule,
  ],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    OAuthService,
    TokenVaultService,
    ProxyService,
    GithubStrategy,
    LinkedInStrategy,
    MetaStrategy,
    FiverrStrategy,
    L3aPlaywrightStrategy,
    AutomationProcessor,
    WebhookRetryProcessor,
  ],
  exports: [IntegrationService, TokenVaultService],
})
export class IntegrationModule {}
