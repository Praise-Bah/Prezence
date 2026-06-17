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
import { UsersService } from '../auth';

@Injectable()
export class AdminBillingService {
  constructor(
    @InjectRepository(SubscriptionRequest)
    private readonly requestRepo: Repository<SubscriptionRequest>,
    @InjectRepository(PaymentEvent)
    private readonly eventRepo: Repository<PaymentEvent>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async listPending(): Promise<SubscriptionRequest[]> {
    return this.requestRepo.find({
      where: {
        status: In(['pending_ai_review', 'provisional']),
        screenedByAi: true,
      },
      order: { createdAt: 'ASC' },
    });
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
    return { message: 'Submission rejected.' };
  }
}
