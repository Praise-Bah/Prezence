import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import type {
  PlatformPublishJobData,
  SupportedPlatform,
  WebhookRetryJobData,
} from '@prezence/types';
import { EventsGateway } from '../../events';
import { NotificationService } from '../../notification';
import { AutomationJobEntity } from '../entities/automation-job.entity';
import { PlatformConnection } from '../entities/platform-connection.entity';
import { TokenVaultService } from '../services/token-vault.service';
import { GithubStrategy } from '../strategies/github.strategy';
import { LinkedInStrategy } from '../strategies/linkedin.strategy';
import { MetaStrategy } from '../strategies/meta.strategy';
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
    @InjectQueue(QUEUE_NAMES.webhook_retry)
    private readonly webhookRetryQueue: Queue<WebhookRetryJobData>,
    private readonly tokenVault: TokenVaultService,
    private readonly config: ConfigService,
    private readonly githubStrategy: GithubStrategy,
    private readonly linkedInStrategy: LinkedInStrategy,
    private readonly metaStrategy: MetaStrategy,
    private readonly l3aStrategy: L3aPlaywrightStrategy,
    private readonly notificationService: NotificationService,
    private readonly eventsGateway: EventsGateway,
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
    this.eventsGateway.emitJobUpdate(userId, {
      jobId: automationJobId,
      type: 'automation',
      platform,
      status: 'running',
    });

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

      this.eventsGateway.emitJobUpdate(userId, {
        jobId: automationJobId,
        type: 'automation',
        platform,
        status: 'completed',
      });

      try {
        await this.notificationService.sendContentReady(userId, platform, 100);
        await this.notificationService.createNotification({
          userId,
          type: 'automation',
          title: 'Profiles updated',
          body: `Your ${platform} profile has been updated.`,
          actionUrl: '/platforms',
        });
      } catch (notifyErr) {
        this.logger.warn(
          `Failed to enqueue content_ready notification for user ${userId}: ${String(notifyErr)}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // L2 escalation — try Make.com webhook if a URL is configured for this platform
      const webhookUrl = this.config.get<string>(
        `MAKE_WEBHOOK_URL_${platform.toUpperCase()}`,
      );

      if (webhookUrl) {
        this.logger.log(
          `L1 failed for ${platform}, escalating to L2 webhook: ${message}`,
        );

        await this.jobRepo.update(automationJobId, {
          status: 'retrying',
          layerUsed: 'L2',
        });

        await this.webhookRetryQueue.add(
          'webhook-retry',
          {
            webhookUrl,
            payload: { platform, contentSections, userId },
            automationJobId,
            userId,
            platform,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10_000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        this.eventsGateway.emitJobUpdate(userId, {
          jobId: automationJobId,
          type: 'automation',
          platform,
          status: 'running',
        });

        return;
      }

      // No L2 configured — mark failed and notify
      await this.jobRepo.update(automationJobId, {
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      });

      this.eventsGateway.emitJobUpdate(userId, {
        jobId: automationJobId,
        type: 'automation',
        platform,
        status: 'failed',
        errorMessage: message,
      });

      try {
        await this.notificationService.sendContentFailed(userId, platform);
        await this.notificationService.createNotification({
          userId,
          type: 'automation',
          title: 'Update failed',
          body: `Your ${platform} profile update failed. Please retry.`,
          actionUrl: '/platforms',
        });
      } catch (notifyErr) {
        this.logger.warn(
          `Failed to enqueue content_failed notification for user ${userId}: ${String(notifyErr)}`,
        );
      }

      throw err;
    }
  }

  private pickStrategy(platform: SupportedPlatform): BasePublisherStrategy {
    switch (platform) {
      case 'github':
        return this.githubStrategy;
      case 'linkedin':
        return this.linkedInStrategy;
      case 'facebook':
      case 'instagram':
        return this.metaStrategy;
      case 'fiverr':
        return this.l3aStrategy;
      default:
        return this.l3aStrategy;
    }
  }
}
