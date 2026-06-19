import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@prezence/config';
import type { EmailType } from './email-templates';

export interface EmailJobData {
  userId: string;
  type: EmailType;
  data: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.email)
    private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  async sendWelcome(userId: string): Promise<void> {
    await this.enqueue(userId, 'user_registered', {});
  }

  async sendPaymentInitiated(
    userId: string,
    opts: {
      reference: string;
      amount: number;
      recipientNumber: string;
      method: string;
    },
  ): Promise<void> {
    await this.enqueue(userId, 'payment_initiated', opts);
  }

  async sendPaymentApproved(userId: string, plan: string): Promise<void> {
    await this.enqueue(userId, 'payment_approved', { plan });
  }

  async sendPaymentProvisional(userId: string, plan: string): Promise<void> {
    await this.enqueue(userId, 'payment_provisional', { plan });
  }

  async sendPaymentRejected(userId: string, reason: string): Promise<void> {
    await this.enqueue(userId, 'payment_rejected', { reason });
  }

  async sendContentReady(
    userId: string,
    platform: string,
    qualityScore: number | null,
  ): Promise<void> {
    await this.enqueue(userId, 'content_ready', { platform, qualityScore });
  }

  async sendContentFailed(userId: string, platform: string): Promise<void> {
    await this.enqueue(userId, 'content_failed', { platform });
  }

  private async enqueue(
    userId: string,
    type: EmailType,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.emailQueue.add(
      'send',
      { userId, type, data },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    this.logger.debug(`Queued ${type} email for user ${userId}`);
  }
}
