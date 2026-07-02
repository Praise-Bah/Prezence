import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Not, Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import type {
  ConnectionStatus,
  IntegrationLayer,
  PlatformPublishJobData,
  SupportedPlatform,
} from '@prezence/types';
import { R2StorageService } from '../billing';
import { ContentService } from '../content';
import { NotificationService } from '../notification';
import type { SkyvernWebhookDto } from './dto/skyvern-webhook.dto';

export interface ConnectionSummary {
  id: string;
  platform: SupportedPlatform;
  layerUsed: IntegrationLayer;
  status: ConnectionStatus;
  scopes: string[];
  connectedAt: Date;
  expiresAt: Date | null;
}
import { AutomationJobEntity } from './entities/automation-job.entity';
import { PlatformConnection } from './entities/platform-connection.entity';
import { TokenVaultService } from './services/token-vault.service';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    @InjectRepository(PlatformConnection)
    private readonly connectionRepo: Repository<PlatformConnection>,
    @InjectRepository(AutomationJobEntity)
    private readonly jobRepo: Repository<AutomationJobEntity>,
    @InjectQueue(QUEUE_NAMES.automation)
    private readonly automationQueue: Queue<PlatformPublishJobData>,
    private readonly tokenVault: TokenVaultService,
    private readonly contentService: ContentService,
    private readonly r2Storage: R2StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  async connect(
    userId: string,
    platform: SupportedPlatform,
    layer: IntegrationLayer,
    accessToken: string,
    refreshToken?: string,
    scopes?: string[],
    expiresAt?: string,
  ): Promise<void> {
    const accessEnc = this.tokenVault.encrypt(accessToken);
    const refreshEnc = refreshToken
      ? this.tokenVault.encrypt(refreshToken)
      : null;

    await this.connectionRepo.upsert(
      {
        userId,
        platform,
        layerUsed: layer,
        accessTokenCiphertext: accessEnc.ciphertext,
        accessTokenIv: accessEnc.iv,
        accessTokenTag: accessEnc.tag,
        refreshTokenCiphertext: refreshEnc?.ciphertext ?? null,
        refreshTokenIv: refreshEnc?.iv ?? null,
        refreshTokenTag: refreshEnc?.tag ?? null,
        scopes: scopes ?? [],
        status: 'active',
        connectedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      ['userId', 'platform'],
    );

    this.logger.log(
      `Platform connected: ${platform} (${layer}) for user ${userId}`,
    );
  }

  async disconnect(userId: string, platform: SupportedPlatform): Promise<void> {
    const connection = await this.connectionRepo.findOne({
      where: { userId, platform, status: Not('revoked') },
    });
    if (!connection) {
      throw new NotFoundException(`No connection found for ${platform}`);
    }
    await this.connectionRepo.update(connection.id, { status: 'revoked' });
    this.logger.log(`Platform disconnected: ${platform} for user ${userId}`);
  }

  async getConnections(userId: string): Promise<ConnectionSummary[]> {
    const rows = await this.connectionRepo.find({ where: { userId } });
    return rows.map(
      ({
        id,
        platform,
        layerUsed,
        status,
        scopes,
        connectedAt,
        expiresAt,
      }) => ({
        id,
        platform,
        layerUsed,
        status,
        scopes,
        connectedAt,
        expiresAt,
      }),
    );
  }

  async triggerPublish(
    userId: string,
    platform: SupportedPlatform,
  ): Promise<{ jobId: string }> {
    const connection = await this.connectionRepo.findOne({
      where: { userId, platform, status: 'active' },
    });
    if (!connection) {
      throw new ConflictException(
        `No active connection for ${platform}. Connect the platform first via POST /integration/connect.`,
      );
    }

    // Reject platforms with no implemented strategy so no retry attempts are
    // wasted on a deterministically-failing job.
    const IMPLEMENTED: SupportedPlatform[] = [
      'github',
      'linkedin',
      'facebook',
      'instagram',
      'fiverr',
    ];
    if (!IMPLEMENTED.includes(platform)) {
      throw new ServiceUnavailableException(
        `Publishing for ${platform} is not yet available. Check back in a future release.`,
      );
    }

    // Fetch current generated content (throws NotFoundException if none)
    const { content: contentSections } = await this.contentService.getContent(
      userId,
      platform,
    );

    const automationJob = this.jobRepo.create({
      userId,
      platform,
      layerUsed: connection.layerUsed,
      status: 'queued',
    });
    await this.jobRepo.save(automationJob);

    await this.automationQueue.add(
      'publish',
      {
        userId,
        platform,
        automationJobId: automationJob.id,
        layer: connection.layerUsed,
        contentSections,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 15000 } },
    );

    this.logger.log(
      `Publish queued: automation job ${automationJob.id} for ${userId}/${platform}`,
    );

    return { jobId: automationJob.id };
  }

  async getJobs(userId: string): Promise<AutomationJobEntity[]> {
    return this.jobRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async handleSkyvernWebhook(dto: SkyvernWebhookDto): Promise<void> {
    const job = await this.jobRepo.findOne({
      where: { skyvernTaskId: dto.task_id },
    });

    if (!job) {
      this.logger.warn(
        `Skyvern webhook: no job found for task_id ${dto.task_id}`,
      );
      return;
    }

    if (dto.status === 'completed') {
      let proofUrl: string | null = null;
      if (dto.screenshot_url) {
        proofUrl = await this.downloadAndStoreScreenshot(
          dto.screenshot_url,
          job.userId,
          job.platform,
        );
      }

      // Atomic compare-and-swap: only update if still 'running'.
      // If the L3B polling loop already wrote 'completed', affected will be 0 and we skip notification.
      const result = await this.jobRepo
        .createQueryBuilder()
        .update()
        .set({
          status: 'completed',
          layerUsed: 'L3B',
          proofUrl,
          completedAt: new Date(),
        })
        .where('id = :id AND status = :status', {
          id: job.id,
          status: 'running',
        })
        .execute();

      if (!result.affected) {
        this.logger.debug(
          `Skyvern webhook: job ${job.id} already finalised by polling — skipping notification`,
        );
        return;
      }

      await this.notificationService.createNotification({
        userId: job.userId,
        type: 'automation',
        title: 'Profile updated via AI vision',
        body: `Your ${job.platform} profile has been updated by Skyvern.`,
        actionUrl: '/platforms',
      });
    } else {
      const reason =
        dto.failure_reason ?? `Skyvern task ended with status: ${dto.status}`;

      const result = await this.jobRepo
        .createQueryBuilder()
        .update()
        .set({
          status: 'failed',
          layerUsed: 'L3B',
          errorMessage: reason,
          completedAt: new Date(),
        })
        .where('id = :id AND status = :status', {
          id: job.id,
          status: 'running',
        })
        .execute();

      if (!result.affected) {
        this.logger.debug(
          `Skyvern webhook: job ${job.id} already finalised by polling — skipping notification`,
        );
        return;
      }

      await this.notificationService.createNotification({
        userId: job.userId,
        type: 'automation',
        title: 'Profile update failed',
        body: `Your ${job.platform} profile could not be updated automatically.`,
        actionUrl: '/platforms',
      });
    }

    this.logger.log(
      `Skyvern webhook handled for task ${dto.task_id} — job ${job.id}`,
    );
  }

  private async downloadAndStoreScreenshot(
    url: string,
    userId: string,
    platform: SupportedPlatform,
  ): Promise<string | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      const key = `proofs/${userId}/${platform}/l3b-webhook-${Date.now()}.png`;
      return this.r2Storage.uploadBuffer(key, buffer, 'image/png');
    } catch {
      this.logger.warn(
        `Failed to download/store Skyvern webhook screenshot for ${platform}/${userId}`,
      );
      return null;
    }
  }
}
