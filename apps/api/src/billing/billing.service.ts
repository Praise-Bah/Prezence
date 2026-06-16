import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { In, Repository } from 'typeorm';
import { PLAN_PRICES_XAF, QUEUE_NAMES } from '@prezence/config';
import { SubscriptionRequest } from './entities/subscription-request.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import type { InitiatePaymentDto } from './dto/initiate-payment.dto';
import type { SubmitProofDto } from './dto/submit-proof.dto';
import type { ScreeningJobData } from './jobs/screenshot-screening.processor';
import { R2StorageService } from './r2-storage.service';

const ACTIVE_STATUSES = ['pending_ai_review', 'provisional'] as const;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(SubscriptionRequest)
    private readonly requestRepo: Repository<SubscriptionRequest>,
    @InjectRepository(PaymentEvent)
    private readonly eventRepo: Repository<PaymentEvent>,
    @InjectQueue(QUEUE_NAMES.screenshot_screening)
    private readonly screeningQueue: Queue<ScreeningJobData>,
    private readonly r2: R2StorageService,
    private readonly config: ConfigService,
  ) {}

  async initiate(
    userId: string,
    dto: InitiatePaymentDto,
  ): Promise<{
    requestId: string;
    paymentReference: string;
    recipientNumber: string;
    amountXaf: number;
    instructions: string;
  }> {
    const existing = await this.requestRepo.findOne({
      where: { userId, plan: dto.plan, status: In([...ACTIVE_STATUSES]) },
    });

    if (existing) {
      throw new BadRequestException(
        'You already have a pending or active request for this plan. Check your billing status.',
      );
    }

    const recipientNumber = this.getRecipientNumber(dto.paymentMethod);
    const amountXaf = PLAN_PRICES_XAF[dto.plan];
    const paymentReference = `PRZ-${randomBytes(3).toString('hex').toUpperCase()}`;

    const request = this.requestRepo.create({
      userId,
      plan: dto.plan,
      amountXaf,
      paymentMethod: dto.paymentMethod,
      paymentReference,
      status: 'pending_ai_review',
      screenshotUrl: null,
    });
    await this.requestRepo.save(request);

    await this.eventRepo.save(
      this.eventRepo.create({
        userId,
        subscriptionRequestId: request.id,
        eventType: 'payment_initiated',
        amountXaf,
        currency: 'XAF',
        provider: dto.paymentMethod,
        payload: { plan: dto.plan, reference: paymentReference },
      }),
    );

    const providerName =
      dto.paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money';
    const instructions =
      `Send exactly XAF ${amountXaf.toLocaleString()} to ${recipientNumber} via ${providerName}. ` +
      `Include the reference code "${paymentReference}" in the payment note. ` +
      `Then take a screenshot of the confirmation and upload it on the next screen.`;

    return {
      requestId: request.id,
      paymentReference,
      recipientNumber,
      amountXaf,
      instructions,
    };
  }

  async submitProof(
    userId: string,
    dto: SubmitProofDto,
    file: Express.Multer.File,
  ): Promise<{ message: string }> {
    const request = await this.requestRepo.findOne({
      where: { id: dto.requestId, userId, status: 'pending_ai_review' },
    });

    if (!request) {
      throw new NotFoundException(
        'Payment request not found or already processed.',
      );
    }

    if (request.screenshotUrl) {
      throw new BadRequestException(
        'A screenshot has already been submitted for this request.',
      );
    }

    const screenshotUrl = await this.r2.uploadProof(userId, request.id, file);

    await this.requestRepo.update(request.id, {
      screenshotUrl,
      transactionRef: dto.transactionRef ?? null,
    });

    const recipientNumber = this.getRecipientNumber(
      request.paymentMethod as 'mtn_momo' | 'orange_money',
    );

    await this.screeningQueue.add(
      'screen',
      {
        requestId: request.id,
        userId,
        screenshotUrl,
        plan: request.plan as Exclude<typeof request.plan, 'free'>,
        paymentMethod: request.paymentMethod as 'mtn_momo' | 'orange_money',
        recipientNumber,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    this.logger.log(
      `Proof submitted for request ${request.id} — queued for AI screening`,
    );

    return {
      message:
        'Screenshot received. Our AI will verify your payment within 2–24 hours. ' +
        "You'll receive an email once your plan is activated.",
    };
  }

  async getStatus(userId: string): Promise<{
    currentPlan: string;
    pendingRequests: SubscriptionRequest[];
  }> {
    const requests = await this.requestRepo.find({
      where: { userId, status: In([...ACTIVE_STATUSES]) },
      order: { createdAt: 'DESC' },
    });

    return { currentPlan: 'free', pendingRequests: requests };
  }

  private getRecipientNumber(method: 'mtn_momo' | 'orange_money'): string {
    const key =
      method === 'mtn_momo' ? 'FOUNDER_MTN_NUMBER' : 'FOUNDER_ORANGE_NUMBER';
    return this.config.getOrThrow<string>(key);
  }
}
