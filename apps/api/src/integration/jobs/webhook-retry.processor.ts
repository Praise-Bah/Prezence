import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import type { WebhookRetryJobData } from '@prezence/types';
import { EventsGateway } from '../../events';
import { NotificationService } from '../../notification';
import { AutomationJobEntity } from '../entities/automation-job.entity';

@Processor(QUEUE_NAMES.webhook_retry)
export class WebhookRetryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookRetryProcessor.name);

  constructor(
    @InjectRepository(AutomationJobEntity)
    private readonly jobRepo: Repository<AutomationJobEntity>,
    private readonly notificationService: NotificationService,
    private readonly eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<WebhookRetryJobData>): Promise<void> {
    const { webhookUrl, payload, automationJobId, userId, platform } = job.data;

    this.logger.log(
      `Webhook retry attempt ${job.attemptsMade + 1} for ${platform} job ${automationJobId}`,
    );

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(
        `Make.com webhook for ${platform} returned ${res.status} ${res.statusText}`,
      );
    }

    await this.jobRepo.update(automationJobId, {
      status: 'completed',
      proofUrl: null,
      completedAt: new Date(),
    });

    this.logger.log(
      `Webhook L2 succeeded for ${platform} job ${automationJobId}`,
    );

    this.eventsGateway.emitJobUpdate(userId, {
      jobId: automationJobId,
      type: 'automation',
      platform,
      status: 'completed',
    });

    await Promise.allSettled([
      this.notificationService.sendContentReady(userId, platform, 100),
      this.notificationService.createNotification({
        userId,
        type: 'automation',
        title: 'Profiles updated',
        body: `Your ${platform} profile has been updated via Make.com.`,
        actionUrl: '/platforms',
      }),
    ]);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<WebhookRetryJobData>): Promise<void> {
    const attemptsAllowed = job.opts.attempts ?? 1;
    if (job.attemptsMade < attemptsAllowed) return;

    const { automationJobId, userId, platform } = job.data;

    this.logger.warn(
      `Webhook L2 exhausted retries for ${platform} job ${automationJobId}`,
    );

    await this.jobRepo.update(automationJobId, {
      status: 'failed',
      errorMessage: `Make.com webhook failed after ${attemptsAllowed} attempts`,
      completedAt: new Date(),
    });

    this.eventsGateway.emitJobUpdate(userId, {
      jobId: automationJobId,
      type: 'automation',
      platform,
      status: 'failed',
      errorMessage: `Platform ${platform} update failed (webhook exhausted)`,
    });

    await Promise.allSettled([
      this.notificationService.sendContentFailed(userId, platform),
      this.notificationService.createNotification({
        userId,
        type: 'automation',
        title: 'Update failed',
        body: `Your ${platform} profile could not be updated. Please retry.`,
        actionUrl: '/platforms',
      }),
    ]);
  }
}
