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

import { ContentService } from '../content';

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

    // Reject unsupported platforms before the job enters the queue so no
    // retry attempts are wasted on a deterministically-failing stub.
    if (platform !== 'github') {
      throw new ServiceUnavailableException(
        `L3A browser automation for ${platform} is not yet available. ` +
          'Check back after the Phase 2 release.',
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
}
