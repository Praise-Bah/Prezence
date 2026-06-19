import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { InterviewResponse, MarketScore, ProfileData } from '../intelligence';
import { REDIS_CLIENT } from '../redis';
import { ContentService } from './content.service';
import { ScheduledPost } from './entities/scheduled-post.entity';

const mockProfile = (platform = 'linkedin'): ProfileData =>
  ({
    id: 'pd-uuid',
    userId: 'user-uuid',
    platform,
    interviewVersion: 1,
    content: { headline: 'Software Engineer' },
    qualityScore: 85,
    generatedAt: new Date(),
    createdAt: new Date(),
  }) as ProfileData;

const mockScore = (platform = 'linkedin'): MarketScore =>
  ({
    id: 'ms-uuid',
    userId: 'user-uuid',
    platform,
    score: 78,
    completeness: 90,
    keywordDensity: 70,
    marketDemand: 70,
    recency: 100,
    recommendations: [],
    computedAt: new Date(),
    createdAt: new Date(),
  }) as MarketScore;

const mockInterview = (): InterviewResponse => ({
  id: 'ir-uuid',
  userId: 'user-uuid',
  platform: 'linkedin',
  interviewVersion: 1,
  answers: {} as never,
  createdAt: new Date(),
});

describe('ContentService', () => {
  let service: ContentService;
  let profileRepo: jest.Mocked<Repository<ProfileData>>;
  let marketScoreRepo: jest.Mocked<Repository<MarketScore>>;
  let interviewRepo: jest.Mocked<Repository<InterviewResponse>>;
  let redis: { get: jest.Mock; del: jest.Mock; exists: jest.Mock };
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
    };
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-uuid' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: getRepositoryToken(ProfileData),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(MarketScore),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(InterviewResponse),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(ScheduledPost),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.content_generation),
          useValue: queue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.content_schedule),
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'sched-job-uuid' }),
            getJob: jest.fn(),
            getDelayed: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(ContentService);
    profileRepo = module.get(getRepositoryToken(ProfileData));
    marketScoreRepo = module.get(getRepositoryToken(MarketScore));
    interviewRepo = module.get(getRepositoryToken(InterviewResponse));
  });

  describe('getContent', () => {
    it('returns content from Redis cache when available', async () => {
      redis.get.mockResolvedValue(
        JSON.stringify({ headline: 'Cached Engineer' }),
      );

      const result = await service.getContent('user-uuid', 'linkedin');

      expect(result.cached).toBe(true);
      expect(result.content).toEqual({ headline: 'Cached Engineer' });
      expect(profileRepo.findOne).not.toHaveBeenCalled();
    });

    it('falls back to DB when cache is empty', async () => {
      redis.get.mockResolvedValue(null);
      profileRepo.findOne.mockResolvedValue(mockProfile());

      const result = await service.getContent('user-uuid', 'linkedin');

      expect(result.cached).toBe(false);
      expect(result.content).toEqual({ headline: 'Software Engineer' });
    });

    it('throws NotFoundException when no content exists', async () => {
      redis.get.mockResolvedValue(null);
      profileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getContent('user-uuid', 'linkedin'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getAllPlatformSummary', () => {
    it('returns summary for all 8 platforms', async () => {
      profileRepo.find.mockResolvedValue([mockProfile('linkedin')]);
      marketScoreRepo.find.mockResolvedValue([mockScore('linkedin')]);

      const result = await service.getAllPlatformSummary('user-uuid');

      expect(result).toHaveLength(8);
      const linkedin = result.find((r) => r.platform === 'linkedin');
      expect(linkedin?.hasContent).toBe(true);
      expect(linkedin?.qualityScore).toBe(85);
      expect(linkedin?.marketScore).toBe(78);

      const github = result.find((r) => r.platform === 'github');
      expect(github?.hasContent).toBe(false);
    });
  });

  describe('regenerate', () => {
    it('queues a generation job and invalidates cache', async () => {
      interviewRepo.findOne.mockResolvedValue(mockInterview());

      const result = await service.regenerate('user-uuid', 'linkedin');

      expect(redis.del).toHaveBeenCalledWith('gen:user-uuid:linkedin:v1');
      expect(queue.add).toHaveBeenCalledWith(
        'generate',
        expect.objectContaining({ userId: 'user-uuid', platform: 'linkedin' }),
        expect.any(Object),
      );
      expect(result.jobId).toBe('job-uuid');
    });

    it('throws NotFoundException when no interview exists', async () => {
      interviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.regenerate('user-uuid', 'linkedin'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
