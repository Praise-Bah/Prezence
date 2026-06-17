import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@prezence/config';
import { NotificationService } from './notification.service';

const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getQueueToken(QUEUE_NAMES.email), useValue: mockQueue },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('enqueues payment_initiated', async () => {
    await service.sendPaymentInitiated('user-1', {
      reference: 'ref-001',
      amount: 5000,
      recipientNumber: '237600000001',
      method: 'mtn_momo',
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        userId: 'user-1',
        type: 'payment_initiated',
        data: expect.objectContaining({ reference: 'ref-001', amount: 5000 }),
      }),
      expect.objectContaining({ attempts: 3 }),
    );
  });

  it('enqueues payment_approved', async () => {
    await service.sendPaymentApproved('user-1', 'pro');
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        type: 'payment_approved',
        data: { plan: 'pro' },
      }),
      expect.anything(),
    );
  });

  it('enqueues payment_rejected', async () => {
    await service.sendPaymentRejected('user-1', 'Low confidence');
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        type: 'payment_rejected',
        data: { reason: 'Low confidence' },
      }),
      expect.anything(),
    );
  });

  it('enqueues content_ready', async () => {
    await service.sendContentReady('user-1', 'linkedin', 88);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        type: 'content_ready',
        data: { platform: 'linkedin', qualityScore: 88 },
      }),
      expect.anything(),
    );
  });

  it('enqueues content_failed', async () => {
    await service.sendContentFailed('user-1', 'twitter');
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        type: 'content_failed',
        data: { platform: 'twitter' },
      }),
      expect.anything(),
    );
  });
});
