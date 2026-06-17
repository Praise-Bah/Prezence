import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { ContentModule } from '../content/content.module';
import { NotificationModule } from '../notification';
import { AutomationJobEntity } from './entities/automation-job.entity';
import { PlatformConnection } from './entities/platform-connection.entity';
import { AutomationProcessor } from './jobs/automation.processor';
import { ProxyService } from './services/proxy.service';
import { TokenVaultService } from './services/token-vault.service';
import { GithubStrategy } from './strategies/github.strategy';
import { L3aPlaywrightStrategy } from './strategies/l3a-playwright.strategy';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformConnection, AutomationJobEntity]),
    BullModule.registerQueue({ name: QUEUE_NAMES.automation }),
    ContentModule,
    NotificationModule,
  ],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    TokenVaultService,
    ProxyService,
    GithubStrategy,
    L3aPlaywrightStrategy,
    AutomationProcessor,
  ],
  exports: [IntegrationService, TokenVaultService],
})
export class IntegrationModule {}
