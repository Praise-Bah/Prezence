import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { QUEUE_NAMES } from '@prezence/config';
import type { ContentGenerationJobData } from '@prezence/types';
import { AiUsageService, PromptRegistryService } from '../../ai';
import { EventsGateway } from '../../events';
import { REDIS_CLIENT } from '../../redis';
import { NotificationService } from '../../notification';
import { InterviewResponse } from '../entities/interview-response.entity';
import { ProfileData } from '../entities/profile-data.entity';
import { EmbeddingService } from '../services/embedding.service';
import { MarketSignalService } from '../market-signal.service';
import { ContentGenerationProcessor } from './content-generation.processor';

const GENERATED_JSON = JSON.stringify({
  sections: { headline: 'Software Engineer', summary: 'I build things.' },
  keywords_used: ['TypeScript', 'NestJS'],
  character_counts: { headline: 18, summary: 17 },
});

const QA_JSON = JSON.stringify({
  quality_score: 85,
  passes_constraints: true,
  issues: [],
  suggestions: [],
});

const mockInterview: InterviewResponse = {
  id: 'ir-uuid',
  userId: 'user-uuid',
  platform: 'linkedin',
  interviewVersion: 1,
  answers: {
    name: 'Praise',
    title: 'Engineer',
    experience_years: '3',
    skills: 'TypeScript',
    bio: 'Builder',
    achievements: 'Built Prezence',
    looking_for: 'Freelance',
    target_audience: 'African tech',
  },
  createdAt: new Date(),
};

const mockProfile: ProfileData = {
  id: 'pd-uuid',
  userId: 'user-uuid',
  platform: 'linkedin',
  interviewVersion: 1,
  content: { headline: 'Software Engineer' },
  qualityScore: 85,
  generatedAt: new Date(),
  createdAt: new Date(),
};

const mockJobData: ContentGenerationJobData = {
  userId: 'user-uuid',
  platform: 'linkedin',
  interviewResponseId: 'ir-uuid',
  interviewVersion: 1,
  userLanguage: 'en',
};

const mockJob = {
  id: 'job-1',
  data: mockJobData,
  opts: { attempts: 3 },
  attemptsMade: 0,
} as unknown as Job<ContentGenerationJobData>;

describe('ContentGenerationProcessor', () => {
  let processor: ContentGenerationProcessor;
  let embeddingService: { generateAndStore: jest.Mock; findSimilar: jest.Mock };
  let profileRepo: { upsert: jest.Mock; findOne: jest.Mock };
  let interviewRepo: { findOne: jest.Mock };
  let aiUsage: { generate: jest.Mock };

  beforeEach(async () => {
    embeddingService = {
      generateAndStore: jest.fn().mockResolvedValue(undefined),
      findSimilar: jest.fn().mockResolvedValue([]),
    };
    profileRepo = {
      upsert: jest
        .fn()
        .mockResolvedValue({ identifiers: [], raw: [], generatedMaps: [] }),
      findOne: jest.fn().mockResolvedValue(mockProfile),
    };
    interviewRepo = {
      findOne: jest.fn().mockResolvedValue(mockInterview),
    };
    aiUsage = {
      generate: jest
        .fn()
        .mockResolvedValueOnce({
          content: GENERATED_JSON,
          promptTokens: 100,
          completionTokens: 200,
        })
        .mockResolvedValueOnce({
          content: QA_JSON,
          promptTokens: 50,
          completionTokens: 100,
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentGenerationProcessor,
        {
          provide: getRepositoryToken(InterviewResponse),
          useValue: interviewRepo,
        },
        { provide: getRepositoryToken(ProfileData), useValue: profileRepo },
        { provide: EmbeddingService, useValue: embeddingService },
        {
          provide: MarketSignalService,
          useValue: {
            fetchSignals: jest.fn().mockResolvedValue(['typescript', 'nestjs']),
          },
        },
        {
          provide: AiUsageService,
          useValue: aiUsage,
        },
        {
          provide: PromptRegistryService,
          useValue: {
            getActive: jest.fn().mockResolvedValue({
              template:
                '{{answers}} {{rag_context}} {{platform}} {{char_limits}} {{language}}',
            }),
            render: jest.fn().mockReturnValue('rendered prompt'),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendContentReady: jest.fn().mockResolvedValue(undefined),
            sendContentFailed: jest.fn().mockResolvedValue(undefined),
            createNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EventsGateway,
          useValue: { emitJobUpdate: jest.fn() },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.mfs_compute),
          useValue: { add: jest.fn().mockResolvedValue({ id: 'mfs-job' }) },
        },
        {
          provide: REDIS_CLIENT,
          useValue: { set: jest.fn().mockResolvedValue('OK') },
        },
      ],
    }).compile();

    processor = module.get(ContentGenerationProcessor);
  });

  it('embeds the generated profile (RAG step 9) after writing to profile_data', async () => {
    await processor.process(mockJob);

    const calls = embeddingService.generateAndStore.mock.calls as [
      string,
      string,
      string,
      string,
      Record<string, unknown>,
    ][];

    const profileEmbedCall = calls.find(
      ([, sourceType]) => sourceType === 'generated_profile',
    );
    expect(profileEmbedCall).toBeDefined();

    const [embUserId, , embSourceId, embContent, embMeta] = profileEmbedCall!;
    expect(embUserId).toBe('user-uuid');
    expect(embSourceId).toBe('pd-uuid');
    expect(JSON.parse(embContent)).toMatchObject({
      headline: 'Software Engineer',
    });
    expect(embMeta).toMatchObject({
      platform: 'linkedin',
      interviewVersion: 1,
    });
  });

  it('also embeds the interview response (RAG step 2)', async () => {
    await processor.process(mockJob);

    const calls = embeddingService.generateAndStore.mock.calls as [
      string,
      string,
    ][];
    const interviewEmbedCall = calls.find(
      ([, sourceType]) => sourceType === 'interview_response',
    );
    expect(interviewEmbedCall).toBeDefined();
  });

  it('calls generateAndStore exactly twice per job (interview + profile)', async () => {
    await processor.process(mockJob);

    expect(embeddingService.generateAndStore).toHaveBeenCalledTimes(2);
  });

  it('does not embed the profile when profile_data row is not found', async () => {
    profileRepo.findOne.mockResolvedValueOnce(null);
    aiUsage.generate
      .mockReset()
      .mockResolvedValueOnce({
        content: GENERATED_JSON,
        promptTokens: 100,
        completionTokens: 200,
      })
      .mockResolvedValueOnce({
        content: QA_JSON,
        promptTokens: 50,
        completionTokens: 100,
      });

    await processor.process(mockJob);

    const calls = embeddingService.generateAndStore.mock.calls as [
      string,
      string,
    ][];
    const profileEmbedCall = calls.find(
      ([, sourceType]) => sourceType === 'generated_profile',
    );
    expect(profileEmbedCall).toBeUndefined();
  });
});
