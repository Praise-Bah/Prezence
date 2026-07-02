import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { BillingModule } from '../billing';
import { ContentModule } from '../content';
import { EventsModule } from '../events';
import { NotificationModule } from '../notification';
import { RedisModule } from '../redis';
import { SharedModule } from '../shared';
import { PlatformConnection } from './entities/platform-connection.entity';
import { AutomationProcessor } from './jobs/automation.processor';
import { L3bProcessor } from './jobs/l3b.processor';
import { WebhookRetryProcessor } from './jobs/webhook-retry.processor';
import { OAuthService } from './services/oauth.service';
import { ProxyService } from './services/proxy.service';
import { TokenVaultService } from './services/token-vault.service';
import { SkyvernService } from './skyvern.service';
import { BehanceStrategy } from './strategies/behance.strategy';
import { DevtoStrategy } from './strategies/devto.strategy';
import { DribbbleStrategy } from './strategies/dribbble.strategy';
import { FiverrStrategy } from './strategies/fiverr.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { HashnodeStrategy } from './strategies/hashnode.strategy';
import { L3aPlaywrightStrategy } from './strategies/l3a-playwright.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { MediumStrategy } from './strategies/medium.strategy';
import { MetaStrategy } from './strategies/meta.strategy';
import { UpworkStrategy } from './strategies/upwork.strategy';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformConnection]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.automation },
      { name: QUEUE_NAMES.webhook_retry },
      { name: QUEUE_NAMES.l3b_jobs },
    ),
    BillingModule,
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
    SkyvernService,
    GithubStrategy,
    LinkedInStrategy,
    MetaStrategy,
    FiverrStrategy,
    UpworkStrategy,
    MediumStrategy,
    DevtoStrategy,
    HashnodeStrategy,
    BehanceStrategy,
    DribbbleStrategy,
    L3aPlaywrightStrategy,
    AutomationProcessor,
    WebhookRetryProcessor,
    L3bProcessor,
  ],
  exports: [IntegrationService, TokenVaultService],
})
export class IntegrationModule {}
