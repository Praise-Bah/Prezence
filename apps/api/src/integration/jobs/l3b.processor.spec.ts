import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import { QUEUE_NAMES } from '@prezence/config';
import type { L3bJobData } from '@prezence/types';
import { R2StorageService } from '../../billing';
import { NotificationService } from '../../notification';
import { REDIS_CLIENT } from '../../redis';
import { AutomationJobEntity } from '../entities/automation-job.entity';
import { PlatformConnection } from '../entities/platform-connection.entity';
import { TokenVaultService } from '../services/token-vault.service';
import { SkyvernService } from '../skyvern.service';
import { L3bProcessor } from './l3b.processor';

const makeJob = (data: L3bJobData): Job<L3bJobData> =>
  ({
    id: 'job-1',
    data,
    opts: { attempts: 1 },
    attemptsMade: 0,
  }) as unknown as Job<L3bJobData>;

describe('L3bProcessor', () => {
  let processor: L3bProcessor;
  let jobRepo: { update: jest.Mock; findOne: jest.Mock; createQueryBuilder: jest.Mock };
  let qb: { update: jest.Mock; set: jest.Mock; where: jest.Mock; execute: jest.Mock };
  let connectionRepo: { findOne: jest.Mock };
  let skyvernService: { runTask: jest.Mock; waitForCompletion: jest.Mock };
  let r2Storage: { uploadBuffer: jest.Mock };
  let notificationService: { createNotification: jest.Mock };

  const jobData: L3bJobData = {
    userId: 'user-1',
    platform: 'fiverr',
    automationJobId: 'auto-job-1',
    contentSections: { tagline: 'Top developer', bio: 'Building things.' },
  };

  beforeEach(async () => {
    qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    jobRepo = {
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    connectionRepo = { findOne: jest.fn().mockResolvedValue(null) };
    skyvernService = {
      runTask: jest.fn().mockResolvedValue({ task_id: 'sky-task-1' }),
      waitForCompletion: jest.fn(),
    };
    r2Storage = {
      uploadBuffer: jest
        .fn()
        .mockResolvedValue('https://r2.example.com/proof.png'),
    };
    notificationService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        L3bProcessor,
        { provide: getRepositoryToken(AutomationJobEntity), useValue: jobRepo },
        {
          provide: getRepositoryToken(PlatformConnection),
          useValue: connectionRepo,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.l3b_jobs),
          useValue: { add: jest.fn() },
        },
        { provide: SkyvernService, useValue: skyvernService },
        { provide: R2StorageService, useValue: r2Storage },
        { provide: NotificationService, useValue: notificationService },
        {
          provide: TokenVaultService,
          useValue: { decrypt: jest.fn().mockReturnValue('') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: REDIS_CLIENT,
          useValue: { get: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    processor = module.get(L3bProcessor);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('process — completed', () => {
    it('uploads screenshot to R2, marks job completed, sends notification', async () => {
      const completedTask = {
        task_id: 'sky-task-1',
        status: 'completed' as const,
        screenshot_url: 'https://skyvern.internal/screenshot.png',
        failure_reason: null,
      };
      skyvernService.waitForCompletion.mockResolvedValue(completedTask);

      // Mock fetch for screenshot download
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      await processor.process(makeJob(jobData));

      expect(skyvernService.runTask).toHaveBeenCalledTimes(1);
      expect(r2Storage.uploadBuffer).toHaveBeenCalledWith(
        expect.stringContaining(`proofs/${jobData.userId}/${jobData.platform}`),
        expect.any(Buffer),
        'image/png',
      );
      expect(qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed', layerUsed: 'L3B' }),
      );
      expect(qb.where).toHaveBeenCalledWith(
        'id = :id AND status = :status',
        { id: jobData.automationJobId, status: 'running' },
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: jobData.userId, type: 'automation' }),
      );
    });
  });

  describe('process — failed', () => {
    it('marks job failed and sends failure notification when Skyvern task fails', async () => {
      const failedTask = {
        task_id: 'sky-task-1',
        status: 'failed' as const,
        screenshot_url: null,
        failure_reason: 'Login page blocked by CAPTCHA',
      };
      skyvernService.waitForCompletion.mockResolvedValue(failedTask);

      await processor.process(makeJob(jobData));

      expect(qb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          layerUsed: 'L3B',
          errorMessage: 'Login page blocked by CAPTCHA',
        }),
      );
      expect(qb.where).toHaveBeenCalledWith(
        'id = :id AND status = :status',
        { id: jobData.automationJobId, status: 'running' },
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: jobData.userId,
          title: 'Profile update failed',
        }),
      );
      expect(r2Storage.uploadBuffer).not.toHaveBeenCalled();
    });
  });
});
