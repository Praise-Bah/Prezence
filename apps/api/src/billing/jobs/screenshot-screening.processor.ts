import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES, SCREENING } from '@prezence/config';
import type { SubscriptionPlan } from '@prezence/types';
import { SubscriptionRequest } from '../entities/subscription-request.entity';
import { ScreenshotScreenerService } from '../screenshot-screener.service';
import { UsersService } from '../../auth/users.service';
import { NotificationService } from '../../notification/notification.service';

export interface ScreeningJobData {
  requestId: string;
  userId: string;
  screenshotUrl: string;
  plan: Exclude<SubscriptionPlan, 'free'>;
  paymentMethod: 'mtn_momo' | 'orange_money';
  recipientNumber: string;
}

@Processor(QUEUE_NAMES.screenshot_screening)
export class ScreenshotScreeningProcessor extends WorkerHost {
  private readonly logger = new Logger(ScreenshotScreeningProcessor.name);

  constructor(
    @InjectRepository(SubscriptionRequest)
    private readonly requestRepo: Repository<SubscriptionRequest>,
    private readonly screener: ScreenshotScreenerService,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<ScreeningJobData>): Promise<void> {
    const {
      requestId,
      userId,
      screenshotUrl,
      plan,
      paymentMethod,
      recipientNumber,
    } = job.data;
    this.logger.log(`Screening job ${job.id} for request ${requestId}`);

    const result = await this.screener.screen(
      screenshotUrl,
      plan,
      paymentMethod,
      recipientNumber,
    );
    const confidenceLevel = this.screener.resolveConfidenceLevel(result.score);

    let newStatus: SubscriptionRequest['status'];

    if (result.score >= SCREENING.confidence.HIGH) {
      newStatus = 'provisional';
      await this.usersService.updatePlan(userId, plan);
      await this.notificationService.sendPaymentApproved(userId, plan);
      this.logger.log(
        `Auto-approved request ${requestId} — upgrading user ${userId} to ${plan}`,
      );
    } else if (result.score >= SCREENING.confidence.MEDIUM) {
      newStatus = 'provisional';
      await this.usersService.updatePlan(userId, plan);
      await this.notificationService.sendPaymentApproved(userId, plan);
      this.logger.log(
        `Provisional grant for request ${requestId} — flagged for admin review`,
      );
    } else {
      newStatus = 'rejected';
      await this.notificationService.sendPaymentRejected(
        userId,
        result.rejection_reason ?? 'Screenshot could not be verified',
      );
      this.logger.warn(`Request ${requestId} rejected — score ${result.score}`);
    }

    await this.requestRepo.update(requestId, {
      screenedByAi: true,
      aiConfidence: result.score,
      aiConfidenceLevel: confidenceLevel,
      aiScreeningResult: { ...result },
      status: newStatus,
    });
  }
}
