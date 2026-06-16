import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { BillingService } from './billing.service';
import { PaymentEvent } from './entities/payment-event.entity';
import { SubscriptionRequest } from './entities/subscription-request.entity';
import { R2StorageService } from './r2-storage.service';

const mockRequest = (
  overrides: Partial<SubscriptionRequest> = {},
): SubscriptionRequest =>
  ({
    id: 'req-uuid',
    userId: 'user-uuid',
    plan: 'professional',
    amountXaf: 6000,
    paymentMethod: 'mtn_momo',
    paymentReference: 'PRZ-ABCDEF',
    screenshotUrl: null,
    transactionRef: null,
    status: 'pending_ai_review',
    screenedByAi: false,
    ...overrides,
  }) as SubscriptionRequest;

describe('BillingService', () => {
  let service: BillingService;
  let requestRepo: jest.Mocked<Repository<SubscriptionRequest>>;
  let eventRepo: jest.Mocked<Repository<PaymentEvent>>;
  let r2: jest.Mocked<R2StorageService>;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    queue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(SubscriptionRequest),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PaymentEvent),
          useValue: { create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.screenshot_screening),
          useValue: queue,
        },
        {
          provide: R2StorageService,
          useValue: { uploadProof: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('+237600000000') },
        },
      ],
    }).compile();

    service = module.get(BillingService);
    requestRepo = module.get(getRepositoryToken(SubscriptionRequest));
    eventRepo = module.get(getRepositoryToken(PaymentEvent));
    r2 = module.get(R2StorageService);

    eventRepo.create.mockReturnValue({} as PaymentEvent);
    eventRepo.save.mockResolvedValue({} as PaymentEvent);
  });

  describe('initiate', () => {
    it('throws BadRequestException when an active request already exists', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest());

      await expect(
        service.initiate('user-uuid', {
          plan: 'professional',
          paymentMethod: 'mtn_momo',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a request and returns payment instructions', async () => {
      requestRepo.findOne.mockResolvedValue(null);
      const saved = mockRequest();
      requestRepo.create.mockReturnValue(saved);
      requestRepo.save.mockResolvedValue(saved);

      const result = await service.initiate('user-uuid', {
        plan: 'professional',
        paymentMethod: 'mtn_momo',
      });

      expect(requestRepo.save).toHaveBeenCalled();
      expect(result.amountXaf).toBe(6000);
      expect(result.paymentReference).toMatch(/^PRZ-[A-F0-9]{6}$/);
      expect(result.instructions).toContain('MTN MoMo');
    });
  });

  describe('submitProof', () => {
    const fakeFile = {
      buffer: Buffer.from('img'),
      mimetype: 'image/jpeg',
      size: 3,
    } as Express.Multer.File;

    it('throws NotFoundException when request is not found', async () => {
      requestRepo.findOne.mockResolvedValue(null);

      await expect(
        service.submitProof('user-uuid', { requestId: 'req-uuid' }, fakeFile),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when screenshot already uploaded', async () => {
      requestRepo.findOne.mockResolvedValue(
        mockRequest({ screenshotUrl: 'https://r2.example.com/proof.jpg' }),
      );

      await expect(
        service.submitProof('user-uuid', { requestId: 'req-uuid' }, fakeFile),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('uploads file, updates request, and queues screening job', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest());
      requestRepo.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      r2.uploadProof.mockResolvedValue('https://r2.example.com/proof.jpg');

      const result = await service.submitProof(
        'user-uuid',
        { requestId: 'req-uuid' },
        fakeFile,
      );

      expect(r2.uploadProof).toHaveBeenCalledWith(
        'user-uuid',
        'req-uuid',
        fakeFile,
      );
      expect(requestRepo.update).toHaveBeenCalledWith(
        'req-uuid',
        expect.objectContaining({
          screenshotUrl: 'https://r2.example.com/proof.jpg',
        }),
      );
      expect(queue.add).toHaveBeenCalledWith(
        'screen',
        expect.objectContaining({ requestId: 'req-uuid' }),
        expect.any(Object),
      );
      expect(result.message).toContain('Screenshot received');
    });
  });

  describe('getStatus', () => {
    it('returns pending requests for the user', async () => {
      const requests = [mockRequest({ status: 'provisional' })];
      requestRepo.find.mockResolvedValue(requests);

      const result = await service.getStatus('user-uuid');

      expect(result.pendingRequests).toHaveLength(1);
    });
  });
});
