import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import type {
  PlatformPublishJobData,
  SupportedPlatform,
} from '@prezence/types';
import { NotificationService } from '../../notification';
import { AutomationJobEntity } from '../entities/automation-job.entity';
import { PlatformConnection } from '../entities/platform-connection.entity';
import { TokenVaultService } from '../services/token-vault.service';
import { GithubStrategy } from '../strategies/github.strategy';
import { L3aPlaywrightStrategy } from '../strategies/l3a-playwright.strategy';
import type { BasePublisherStrategy } from '../strategies/base-publisher.strategy';

@Processor(QUEUE_NAMES.automation)
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(
    @InjectRepository(AutomationJobEntity)
    private readonly jobRepo: Repository<AutomationJobEntity>,
    @InjectRepository(PlatformConnection)
    private readonly connectionRepo: Repository<PlatformConnection>,
    private readonly tokenVault: TokenVaultService,
    private readonly githubStrategy: GithubStrategy,
    private readonly l3aStrategy: L3aPlaywrightStrategy,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<PlatformPublishJobData>): Promise<void> {
    const { userId, platform, automationJobId, layer, contentSections } =
      job.data;
    this.logger.log(
      `Automation job ${job.id} — ${platform} (${layer}) for user ${userId}`,
    );

    await this.jobRepo.update(automationJobId, { status: 'running' });

    try {
      const connection = await this.connectionRepo.findOne({
        where: { userId, platform, status: 'active' },
      });
      if (!connection) {
        throw new Error(`No active connection found for ${platform}`);
      }

      const accessToken = this.tokenVault.decrypt(
        connection.accessTokenCiphertext,
        connection.accessTokenIv,
        connection.accessTokenTag,
      );

      const strategy = this.pickStrategy(platform);
      const proofUrl = await strategy.publish(
        accessToken,
        contentSections,
        platform,
      );

      await this.jobRepo.update(automationJobId, {
        status: 'completed',
        proofUrl: proofUrl ?? null,
        completedAt: new Date(),
      });

      this.logger.log(
        `Automation job ${String(job.id)} completed for ${platform}`,
      );

      try {
        await this.notificationService.sendContentReady(userId, platform, 100);
      } catch (notifyErr) {
        this.logger.warn(
          `Failed to enqueue content_ready notification for user ${userId}: ${String(notifyErr)}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.jobRepo.update(automationJobId, {
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      });

      try {
        await this.notificationService.sendContentFailed(userId, platform);
      } catch (notifyErr) {
        this.logger.warn(
          `Failed to enqueue content_failed notification for user ${userId}: ${String(notifyErr)}`,
        );
      }

      throw err;
    }
  }

  private pickStrategy(platform: SupportedPlatform): BasePublisherStrategy {
    if (platform === 'github') return this.githubStrategy;
    return this.l3aStrategy;
  }
}
