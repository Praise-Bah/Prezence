import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfileData } from '../entities/profile-data.entity';
import { EmbeddingService } from '../services/embedding.service';
import { EmbeddingCronService } from './embedding-cron.service';

const mockProfileRepo = () => ({
  find: jest.fn(),
});

const mockEmbeddingService = () => ({
  generateAndStore: jest.fn(),
});

const makeProfile = (overrides: Partial<ProfileData> = {}): ProfileData => ({
  id: 'prof-1',
  userId: 'user-1',
  platform: 'linkedin' as const,
  content: { headline: 'Dev at Prezence', summary: 'I build things.' },
  interviewVersion: 1,
  qualityScore: 80,
  generatedAt: new Date(),
  createdAt: new Date(),
  ...overrides,
});

describe('EmbeddingCronService', () => {
  let service: EmbeddingCronService;
  let profileRepo: ReturnType<typeof mockProfileRepo>;
  let embeddingService: ReturnType<typeof mockEmbeddingService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EmbeddingCronService,
        {
          provide: getRepositoryToken(ProfileData),
          useFactory: mockProfileRepo,
        },
        { provide: EmbeddingService, useFactory: mockEmbeddingService },
      ],
    }).compile();

    service = module.get(EmbeddingCronService);
    profileRepo = module.get(getRepositoryToken(ProfileData));
    embeddingService = module.get(EmbeddingService);
  });

  it('calls generateAndStore for each profile returned by the repo', async () => {
    profileRepo.find.mockResolvedValue([
      makeProfile(),
      makeProfile({ id: 'prof-2', userId: 'user-2' }),
    ]);
    embeddingService.generateAndStore.mockResolvedValue(undefined);

    await service.runNightlyEmbedding();

    expect(embeddingService.generateAndStore).toHaveBeenCalledTimes(2);
  });

  it('passes joined content values as text to generateAndStore', async () => {
    const profile = makeProfile();
    profileRepo.find.mockResolvedValue([profile]);
    embeddingService.generateAndStore.mockResolvedValue(undefined);

    await service.runNightlyEmbedding();

    const [userId, sourceType, sourceId, text] = embeddingService
      .generateAndStore.mock.calls[0] as [string, string, string, string];
    expect(userId).toBe('user-1');
    expect(sourceType).toBe('profile_data');
    expect(sourceId).toBe('prof-1');
    expect(text).toContain('Dev at Prezence');
    expect(text).toContain('I build things.');
  });

  it('does nothing when no profiles are updated within the window', async () => {
    profileRepo.find.mockResolvedValue([]);

    await service.runNightlyEmbedding();

    expect(embeddingService.generateAndStore).not.toHaveBeenCalled();
  });

  it('continues processing remaining profiles when one embedding fails', async () => {
    profileRepo.find.mockResolvedValue([
      makeProfile({ id: 'prof-1' }),
      makeProfile({ id: 'prof-2' }),
    ]);
    embeddingService.generateAndStore
      .mockRejectedValueOnce(new Error('OpenRouter timeout'))
      .mockResolvedValueOnce(undefined);

    await expect(service.runNightlyEmbedding()).resolves.not.toThrow();
    expect(embeddingService.generateAndStore).toHaveBeenCalledTimes(2);
  });
});
