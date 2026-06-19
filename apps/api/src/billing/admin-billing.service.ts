import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { SubscriptionRequest } from './entities/subscription-request.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import type { ReviewSubmissionDto } from './dto/review-submission.dto';
import type {
  PaymentMethod,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prezence/types';
import { UsersService } from '../auth';
import { NotificationService } from '../notification';

export interface PendingSubmission {
  id: string;
  userId: string;
  userEmail: string | null;
  plan: SubscriptionPlan;
  amountXaf: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  screenshotUrl: string | null;
  transactionRef: string | null;
  status: SubscriptionStatus;
  aiConfidence: number | null;
  aiConfidenceLevel: string | null;
  aiScreeningResult: Record<string, unknown> | null;
  createdAt: Date;
}

@Injectable()
export class AdminBillingService {
  constructor(
    @InjectRepository(SubscriptionRequest)
    private readonly requestRepo: Repository<SubscriptionRequest>,
    @InjectRepository(PaymentEvent)
    private readonly eventRepo: Repository<PaymentEvent>,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  async listPending(): Promise<PendingSubmission[]> {
    const requests = await this.requestRepo.find({
      where: {
        status: In(['pending_ai_review', 'provisional']),
        screenedByAi: true,
      },
      order: { createdAt: 'ASC' },
    });

    const userIds = [...new Set(requests.map((r) => r.userId))];
    const users = await this.usersService.findManyByIds(userIds);
    const emailById = new Map(users.map((u) => [u.id, u.email]));

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: emailById.get(r.userId) ?? null,
      plan: r.plan,
      amountXaf: r.amountXaf,
      paymentMethod: r.paymentMethod,
      paymentReference: r.paymentReference,
      screenshotUrl: r.screenshotUrl,
      transactionRef: r.transactionRef,
      status: r.status,
      aiConfidence: r.aiConfidence,
      aiConfidenceLevel: r.aiConfidenceLevel,
      aiScreeningResult: r.aiScreeningResult,
      createdAt: r.createdAt,
    }));
  }

  async review(
    requestId: string,
    reviewerId: string,
    dto: ReviewSubmissionDto,
  ): Promise<{ message: string }> {
    const request = await this.requestRepo.findOne({
      where: {
        id: requestId,
        status: In(['pending_ai_review', 'provisional']),
      },
    });

    if (!request) {
      throw new NotFoundException('Submission not found or already reviewed.');
    }

    if (dto.action === 'approve') {
      await this.requestRepo.update(requestId, {
        status: 'confirmed',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
        adminNotes: dto.adminNotes ?? null,
      });
      await this.usersService.updatePlan(request.userId, request.plan);
      await this.eventRepo.save(
        this.eventRepo.create({
          userId: request.userId,
          subscriptionRequestId: requestId,
          eventType: 'payment_confirmed',
          amountXaf: request.amountXaf,
          currency: 'XAF',
          provider: request.paymentMethod,
          payload: { reviewedBy: reviewerId, notes: dto.adminNotes },
        }),
      );
      this.notificationService
        .createNotification({
          userId: request.userId,
          type: 'billing',
          title: 'Subscription active!',
          body: `Your ${request.plan} plan has been confirmed by our team.`,
          actionUrl: '/billing',
        })
        .catch(() => undefined);
      return { message: `Approved — user upgraded to ${request.plan}.` };
    }

    if (!dto.adminNotes) {
      throw new BadRequestException('A rejection reason is required.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(SubscriptionRequest, requestId, {
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: dto.adminNotes,
        adminNotes: dto.adminNotes,
      });

      if (request.status === 'provisional') {
        await this.usersService.updatePlan(request.userId, 'free', manager);
      }

      await manager.save(
        PaymentEvent,
        this.eventRepo.create({
          userId: request.userId,
          subscriptionRequestId: requestId,
          eventType: 'payment_rejected',
          amountXaf: request.amountXaf,
          currency: 'XAF',
          provider: request.paymentMethod,
          payload: { reviewedBy: reviewerId, reason: dto.adminNotes },
        }),
      );
    });
    this.notificationService
      .createNotification({
        userId: request.userId,
        type: 'billing',
        title: 'Payment not verified',
        body: 'Our team could not verify your payment. Please submit a new screenshot.',
        actionUrl: '/billing',
      })
      .catch(() => undefined);
    return { message: 'Submission rejected.' };
  }
}
