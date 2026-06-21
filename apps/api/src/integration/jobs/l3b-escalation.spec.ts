import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { QUEUE_NAMES } from '@prezence/config';
import type {
  PlatformPublishJobData,
  WebhookRetryJobData,
} from '@prezence/types';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from '../../events';
import { NotificationService } from '../../notification';
import { AutomationJobEntity } from '../entities/automation-job.entity';
import { PlatformConnection } from '../entities/platform-connection.entity';
import { TokenVaultService } from '../services/token-vault.service';
import { GithubStrategy } from '../strategies/github.strategy';
import { LinkedInStrategy } from '../strategies/linkedin.strategy';
import { MetaStrategy } from '../strategies/meta.strategy';
import { L3aPlaywrightStrategy } from '../strategies/l3a-playwright.strategy';
import { AutomationProcessor } from './automation.processor';
import { WebhookRetryProcessor } from './webhook-retry.processor';

const makeJobWith = <T>(
  data: T,
  opts: { attempts: number; attemptsMade: number },
): Job<T> =>
  ({
    id: 'j-1',
    data,
    opts: { attempts: opts.attempts },
    attemptsMade: opts.attemptsMade,
  }) as unknown as Job<T>;

describe('L3B escalation — AutomationProcessor.onFailed (L3A layer)', () => {
  let processor: AutomationProcessor;
  let jobRepo: { update: jest.Mock };
  let l3bQueue: { add: jest.Mock };
  let eventsGateway: { emitJobUpdate: jest.Mock };

  beforeEach(async () => {
    jobRepo = { update: jest.fn().mockResolvedValue(undefined) };
    l3bQueue = { add: jest.fn().mockResolvedValue(undefined) };
    eventsGateway = { emitJobUpdate: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AutomationProcessor,
        { provide: getRepositoryToken(AutomationJobEntity), useValue: jobRepo },
        {
          provide: getRepositoryToken(PlatformConnection),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.webhook_retry),
          useValue: { add: jest.fn() },
        },
        { provide: getQueueToken(QUEUE_NAMES.l3b_jobs), useValue: l3bQueue },
        { provide: TokenVaultService, useValue: { decrypt: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(null) },
        },
        { provide: GithubStrategy, useValue: { publish: jest.fn() } },
        { provide: LinkedInStrategy, useValue: { publish: jest.fn() } },
        { provide: MetaStrategy, useValue: { publish: jest.fn() } },
        { provide: L3aPlaywrightStrategy, useValue: { publish: jest.fn() } },
        {
          provide: NotificationService,
          useValue: {
            sendContentFailed: jest.fn(),
            createNotification: jest.fn(),
          },
        },
        { provide: EventsGateway, useValue: eventsGateway },
      ],
    }).compile();
    processor = module.get(AutomationProcessor);
  });

  it('escalates to L3B when L3A layer exhausts all retries', async () => {
    const jobData: PlatformPublishJobData = {
      userId: 'u-1',
      platform: 'fiverr',
      automationJobId: 'auto-1',
      layer: 'L3A',
      contentSections: { bio: 'Expert dev' },
    };

    await processor.onFailed(
      makeJobWith(jobData, { attempts: 3, attemptsMade: 3 }),
    );

    expect(jobRepo.update).toHaveBeenCalledWith(
      'auto-1',
      expect.objectContaining({ status: 'retrying', layerUsed: 'L3B' }),
    );
    expect(l3bQueue.add).toHaveBeenCalledWith(
      'l3b-publish',
      expect.objectContaining({
        userId: 'u-1',
        platform: 'fiverr',
        automationJobId: 'auto-1',
        contentSections: { bio: 'Expert dev' },
      }),
      expect.objectContaining({ attempts: 1 }),
    );
  });

  it('does not escalate when layer is not L3A', async () => {
    const jobData: PlatformPublishJobData = {
      userId: 'u-1',
      platform: 'linkedin',
      automationJobId: 'auto-2',
      layer: 'L1',
      contentSections: {},
    };

    await processor.onFailed(
      makeJobWith(jobData, { attempts: 3, attemptsMade: 3 }),
    );

    expect(l3bQueue.add).not.toHaveBeenCalled();
  });
});

describe('L3B escalation — WebhookRetryProcessor.onFailed (L2 exhausted)', () => {
  let processor: WebhookRetryProcessor;
  let jobRepo: { update: jest.Mock };
  let l3bQueue: { add: jest.Mock };
  let eventsGateway: { emitJobUpdate: jest.Mock };

  beforeEach(async () => {
    jobRepo = { update: jest.fn().mockResolvedValue(undefined) };
    l3bQueue = { add: jest.fn().mockResolvedValue(undefined) };
    eventsGateway = { emitJobUpdate: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        WebhookRetryProcessor,
        { provide: getRepositoryToken(AutomationJobEntity), useValue: jobRepo },
        { provide: getQueueToken(QUEUE_NAMES.l3b_jobs), useValue: l3bQueue },
        {
          provide: NotificationService,
          useValue: {
            sendContentFailed: jest.fn(),
            createNotification: jest.fn(),
          },
        },
        { provide: EventsGateway, useValue: eventsGateway },
      ],
    }).compile();
    processor = module.get(WebhookRetryProcessor);
  });

  it('escalates to L3B when L2 webhook exhausts all retries', async () => {
    const jobData: WebhookRetryJobData = {
      webhookUrl: 'https://hook.make.com/abc',
      payload: {
        platform: 'linkedin',
        contentSections: { headline: 'Software Engineer' },
        userId: 'u-2',
      },
      automationJobId: 'auto-3',
      userId: 'u-2',
      platform: 'linkedin',
    };

    await processor.onFailed(
      makeJobWith(jobData, { attempts: 3, attemptsMade: 3 }),
    );

    expect(jobRepo.update).toHaveBeenCalledWith(
      'auto-3',
      expect.objectContaining({ status: 'retrying', layerUsed: 'L3B' }),
    );
    expect(l3bQueue.add).toHaveBeenCalledWith(
      'l3b-publish',
      expect.objectContaining({
        userId: 'u-2',
        platform: 'linkedin',
        automationJobId: 'auto-3',
        contentSections: { headline: 'Software Engineer' },
      }),
      expect.objectContaining({ attempts: 1 }),
    );
    expect(eventsGateway.emitJobUpdate).toHaveBeenCalledWith(
      'u-2',
      expect.objectContaining({ status: 'running' }),
    );
  });

  it('ignores non-final failures (retries remaining)', async () => {
    const jobData: WebhookRetryJobData = {
      webhookUrl: 'https://hook.make.com/abc',
      payload: {},
      automationJobId: 'auto-4',
      userId: 'u-3',
      platform: 'linkedin',
    };

    await processor.onFailed(
      makeJobWith(jobData, { attempts: 3, attemptsMade: 1 }),
    );

    expect(l3bQueue.add).not.toHaveBeenCalled();
  });
});
