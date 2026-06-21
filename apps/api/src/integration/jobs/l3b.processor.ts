import { Inject, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '@prezence/config';
import type { L3bJobData, SupportedPlatform } from '@prezence/types';
import { R2StorageService } from '../../billing';
import { NotificationService } from '../../notification';
import { REDIS_CLIENT } from '../../redis';
import type { Redis } from 'ioredis';
import { buildFiverrL3bPayload } from '../l3b-strategies/fiverr.l3b';
import { buildInstagramL3bPayload } from '../l3b-strategies/instagram.l3b';
import { buildLinkedInL3bPayload } from '../l3b-strategies/linkedin.l3b';
import { buildYoutubeL3bPayload } from '../l3b-strategies/youtube.l3b';
import { AutomationJobEntity } from '../entities/automation-job.entity';
import { PlatformConnection } from '../entities/platform-connection.entity';
import { TokenVaultService } from '../services/token-vault.service';
import type { SkyvernTaskPayload } from '../skyvern.service';
import { SkyvernService } from '../skyvern.service';

@Processor(QUEUE_NAMES.l3b_jobs)
export class L3bProcessor extends WorkerHost {
  private readonly logger = new Logger(L3bProcessor.name);

  constructor(
    @InjectRepository(AutomationJobEntity)
    private readonly jobRepo: Repository<AutomationJobEntity>,
    @InjectRepository(PlatformConnection)
    private readonly connectionRepo: Repository<PlatformConnection>,
    @InjectQueue(QUEUE_NAMES.l3b_jobs)
    private readonly _l3bQueue: Queue<L3bJobData>,
    private readonly skyvernService: SkyvernService,
    private readonly r2Storage: R2StorageService,
    private readonly notificationService: NotificationService,
    private readonly tokenVault: TokenVaultService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job<L3bJobData>): Promise<void> {
    const { userId, platform, automationJobId, contentSections } = job.data;

    this.logger.log(
      `L3B job ${String(job.id)} — ${platform} for user ${userId}`,
    );

    await this.jobRepo.update(automationJobId, {
      status: 'running',
      layerUsed: 'L3B',
    });

    // Get session cookie: try Redis first, fall back to decrypting from DB
    const sessionCookie = await this.getSessionCookie(userId, platform);

    // Build the Skyvern task payload for this platform
    const webhookUrl = this.buildWebhookUrl();
    const payload = this.buildPayload(
      platform,
      userId,
      contentSections,
      webhookUrl,
    );
    // Cookie is passed separately (not in formData) so it stays out of Skyvern's task logs
    if (sessionCookie) payload.sessionCookie = sessionCookie;

    // Start the Skyvern task
    const { task_id: taskId } = await this.skyvernService.runTask(payload);

    // Persist the task ID so the webhook endpoint can look up the job
    await this.jobRepo.update(automationJobId, {
      skyvernTaskId: taskId,
    });

    this.logger.log(
      `Skyvern task ${taskId} started for ${platform} job ${automationJobId}`,
    );

    // Poll until Skyvern completes or times out (8 min matching CLAUDE.md spec)
    const task = await this.skyvernService.waitForCompletion(taskId, 480_000);

    if (task.status === 'completed') {
      // Download screenshot from Skyvern and re-upload to our R2
      let proofUrl: string | null = null;
      if (task.screenshot_url) {
        proofUrl = await this.uploadScreenshotToR2(
          task.screenshot_url,
          userId,
          platform,
        );
      }

      await this.jobRepo.update(automationJobId, {
        status: 'completed',
        layerUsed: 'L3B',
        proofUrl,
        completedAt: new Date(),
      });

      this.logger.log(
        `L3B completed for ${platform} job ${automationJobId} — proof: ${proofUrl ?? 'none'}`,
      );

      await this.notificationService.createNotification({
        userId,
        type: 'automation',
        title: 'Profile updated via AI vision',
        body: `Your ${platform} profile has been updated by Skyvern.`,
        actionUrl: '/platforms',
      });
    } else {
      // failed or timed_out
      const reason =
        task.failure_reason ?? `Skyvern task ended with status: ${task.status}`;

      this.logger.warn(
        `L3B ${task.status} for ${platform} job ${automationJobId}: ${reason}`,
      );

      await this.jobRepo.update(automationJobId, {
        status: 'failed',
        layerUsed: 'L3B',
        errorMessage: reason,
        completedAt: new Date(),
      });

      await this.notificationService.createNotification({
        userId,
        type: 'automation',
        title: 'Profile update failed',
        body: `Your ${platform} profile could not be updated automatically. Please update it manually.`,
        actionUrl: '/platforms',
      });
    }
  }

  private async getSessionCookie(
    userId: string,
    platform: SupportedPlatform,
  ): Promise<string> {
    const redisKey = `session:${userId}:${platform}`;
    const cached = await this.redis.get(redisKey);
    if (cached) return cached;

    // Fall back to decrypting the stored OAuth token
    const connection = await this.connectionRepo.findOne({
      where: { userId, platform, status: 'active' },
    });
    if (!connection) return '';

    return this.tokenVault.decrypt(
      connection.accessTokenCiphertext,
      connection.accessTokenIv,
      connection.accessTokenTag,
    );
  }

  private buildWebhookUrl(): string | null {
    const apiUrl = this.config.get<string>('API_URL');
    if (!apiUrl) return null;
    return `${apiUrl}/integration/skyvern/webhook`;
  }

  private buildPayload(
    platform: SupportedPlatform,
    userId: string,
    content: Record<string, string>,
    webhookUrl: string | null,
  ): SkyvernTaskPayload {
    switch (platform) {
      case 'fiverr':
        return buildFiverrL3bPayload(userId, content, webhookUrl);
      case 'linkedin':
        return buildLinkedInL3bPayload(userId, content, webhookUrl);
      case 'instagram':
        return buildInstagramL3bPayload(userId, content, webhookUrl);
      case 'youtube':
        return buildYoutubeL3bPayload(userId, content, webhookUrl);
      default:
        return buildFiverrL3bPayload(userId, content, webhookUrl);
    }
  }

  private async uploadScreenshotToR2(
    screenshotUrl: string,
    userId: string,
    platform: SupportedPlatform,
  ): Promise<string | null> {
    try {
      const res = await fetch(screenshotUrl, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        this.logger.warn(
          `Failed to download Skyvern screenshot: ${res.status}`,
        );
        return null;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const key = `proofs/${userId}/${platform}/l3b-${Date.now()}.png`;
      return this.r2Storage.uploadBuffer(key, buffer, 'image/png');
    } catch (err) {
      this.logger.warn(
        `Screenshot R2 upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
