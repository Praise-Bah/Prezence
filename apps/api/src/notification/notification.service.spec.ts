import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { EventsGateway } from '../events';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';

const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };
const mockEventsGateway = { emitNotification: jest.fn() };

const mockNotification: Partial<Notification> = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'billing',
  title: 'Test',
  body: 'Test body',
  actionUrl: '/billing',
  isRead: false,
  createdAt: new Date('2026-06-19T00:00:00Z'),
};

const mockRepo = {
  create: jest.fn((input: Partial<Notification>) => ({ ...input })),
  save: jest.fn().mockResolvedValue(mockNotification),
  find: jest.fn().mockResolvedValue([mockNotification]),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getQueueToken(QUEUE_NAMES.email), useValue: mockQueue },
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
        { provide: EventsGateway, useValue: mockEventsGateway },
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

  it('enqueues user_registered welcome email', async () => {
    await service.sendWelcome('user-1');
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({ userId: 'user-1', type: 'user_registered' }),
      expect.objectContaining({ attempts: 3 }),
    );
  });

  describe('createNotification', () => {
    it('saves a notification row to the database', async () => {
      await service.createNotification({
        userId: 'user-1',
        type: 'billing',
        title: 'Subscription active!',
        body: 'Your plan is now active.',
        actionUrl: '/billing',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'billing',
          title: 'Subscription active!',
          body: 'Your plan is now active.',
          actionUrl: '/billing',
        }),
      );
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('emits notification:new via EventsGateway after saving', async () => {
      await service.createNotification({
        userId: 'user-1',
        type: 'billing',
        title: 'Subscription active!',
        body: 'Your plan is now active.',
        actionUrl: '/billing',
      });

      expect(mockEventsGateway.emitNotification).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          id: 'notif-1',
          type: 'billing',
          title: 'Test',
        }),
      );
    });

    it('stores null actionUrl when omitted', async () => {
      await service.createNotification({
        userId: 'user-1',
        type: 'profile',
        title: 'Profiles ready',
        body: 'AI profiles are ready.',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actionUrl: null }),
      );
    });
  });

  describe('listForUser', () => {
    it('returns notifications for the given user ordered by createdAt DESC', async () => {
      const result = await service.listForUser('user-1');
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('markRead', () => {
    it('returns { updated: true } when notification belongs to user', async () => {
      mockRepo.update.mockResolvedValueOnce({ affected: 1 });
      const result = await service.markRead('notif-1', 'user-1');
      expect(result).toEqual({ updated: true });
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'notif-1', userId: 'user-1' },
        { isRead: true },
      );
    });

    it('returns { updated: false } when notification does not belong to user', async () => {
      mockRepo.update.mockResolvedValueOnce({ affected: 0 });
      const result = await service.markRead('notif-1', 'other-user');
      expect(result).toEqual({ updated: false });
    });
  });

  describe('markAllRead', () => {
    it('marks all unread notifications for the user', async () => {
      mockRepo.update.mockResolvedValueOnce({ affected: 3 });
      const result = await service.markAllRead('user-1');
      expect(result).toEqual({ updated: 3 });
      expect(mockRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isRead: false },
        { isRead: true },
      );
    });
  });
});
