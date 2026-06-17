import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { IntelligenceService } from './intelligence.service';
import { InterviewResponse } from './entities/interview-response.entity';
import { ProfileData } from './entities/profile-data.entity';
import { MarketScore } from './entities/market-score.entity';
import type { GenerateContentDto } from './dto/generate-content.dto';

const mockInterview = (
  overrides: Partial<InterviewResponse> = {},
): InterviewResponse => ({
  id: 'ir-uuid',
  userId: 'user-uuid',
  platform: 'linkedin',
  interviewVersion: 1,
  answers: {
    name: 'Praise Bah',
    title: 'Software Engineer',
    experience_years: '3',
    skills: 'TypeScript, NestJS',
    bio: 'Passionate engineer',
    achievements: 'Built Prezence',
    looking_for: 'Freelance clients',
    target_audience: 'African tech companies',
  },
  createdAt: new Date(),
  ...overrides,
});

const mockProfile = (): ProfileData => ({
  id: 'pd-uuid',
  userId: 'user-uuid',
  platform: 'linkedin',
  interviewVersion: 1,
  content: { headline: 'Software Engineer' },
  qualityScore: 85,
  generatedAt: new Date(),
  createdAt: new Date(),
});

const mockMarketScore = (): MarketScore => ({
  id: 'ms-uuid',
  userId: 'user-uuid',
  platform: 'linkedin',
  score: 78,
  completeness: 90,
  keywordDensity: 70,
  marketDemand: 70,
  recency: 100,
  recommendations: ['Add more skills'],
  computedAt: new Date(),
  createdAt: new Date(),
});

describe('IntelligenceService', () => {
  let service: IntelligenceService;
  let interviewRepo: jest.Mocked<Repository<InterviewResponse>>;
  let profileRepo: jest.Mocked<Repository<ProfileData>>;
  let marketScoreRepo: jest.Mocked<Repository<MarketScore>>;
  let queue: { add: jest.Mock };

  const dto: GenerateContentDto = {
    platform: 'linkedin',
    language: 'en',
    answers: {
      name: 'Praise Bah',
      title: 'Software Engineer',
      experience_years: '3',
      skills: 'TypeScript, NestJS',
      bio: 'Passionate engineer',
      achievements: 'Built Prezence',
      looking_for: 'Freelance clients',
      target_audience: 'African tech companies',
    },
  };

  beforeEach(async () => {
    queue = { add: jest.fn().mockResolvedValue({ id: 'job-uuid' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceService,
        {
          provide: getRepositoryToken(InterviewResponse),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProfileData),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(MarketScore),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.content_generation),
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get(IntelligenceService);
    interviewRepo = module.get(getRepositoryToken(InterviewResponse));
    profileRepo = module.get(getRepositoryToken(ProfileData));
    marketScoreRepo = module.get(getRepositoryToken(MarketScore));
  });

  describe('submitInterview', () => {
    it('creates a new interview response and queues a generation job', async () => {
      interviewRepo.findOne.mockResolvedValue(null);
      interviewRepo.create.mockReturnValue(mockInterview());
      interviewRepo.save.mockResolvedValue(mockInterview());

      const result = await service.submitInterview('user-uuid', dto);

      expect(interviewRepo.save).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith(
        'generate',
        expect.objectContaining({ userId: 'user-uuid', platform: 'linkedin' }),
        expect.any(Object),
      );
      expect(result.jobId).toBe('job-uuid');
      expect(result.message).toContain('being generated');
    });

    it('updates an existing interview response instead of creating a duplicate', async () => {
      interviewRepo.findOne.mockResolvedValue(mockInterview());
      interviewRepo.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      const result = await service.submitInterview('user-uuid', dto);

      expect(interviewRepo.update).toHaveBeenCalledWith('ir-uuid', {
        answers: dto.answers,
      });
      expect(interviewRepo.save).not.toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalled();
      expect(result.jobId).toBe('job-uuid');
    });
  });

  describe('getProfile', () => {
    it('returns the latest profile for the user + platform', async () => {
      profileRepo.findOne.mockResolvedValue(mockProfile());

      const result = await service.getProfile('user-uuid', 'linkedin');

      expect(result.platform).toBe('linkedin');
      expect(result.qualityScore).toBe(85);
    });

    it('throws NotFoundException when no profile exists', async () => {
      profileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getProfile('user-uuid', 'linkedin'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getMarketFit', () => {
    it('returns the latest market score for the user + platform', async () => {
      marketScoreRepo.findOne.mockResolvedValue(mockMarketScore());

      const result = await service.getMarketFit('user-uuid', 'linkedin');

      expect(result.score).toBe(78);
      expect(result.recommendations).toContain('Add more skills');
    });

    it('throws NotFoundException when no market score exists', async () => {
      marketScoreRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getMarketFit('user-uuid', 'linkedin'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
