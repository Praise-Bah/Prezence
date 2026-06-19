import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REDIS_CLIENT } from '../redis';
import { PromptRegistry } from './entities/prompt-registry.entity';
import { PromptRegistryService } from './services/prompt-registry.service';

const mockRepo = () => ({
  findOne: jest.fn(),
});

const mockRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
});

const makePrompt = (
  overrides: Partial<PromptRegistry> = {},
): PromptRegistry => ({
  id: 'p1',
  name: 'generate_profile',
  template: 'Hello {{name}}',
  model: 'anthropic/claude-sonnet-4.5',
  isActive: true,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('PromptRegistryService', () => {
  let service: PromptRegistryService;
  let repo: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PromptRegistryService,
        { provide: getRepositoryToken(PromptRegistry), useFactory: mockRepo },
        { provide: REDIS_CLIENT, useFactory: mockRedis },
      ],
    }).compile();

    service = module.get(PromptRegistryService);
    repo = module.get(getRepositoryToken(PromptRegistry));
    redis = module.get(REDIS_CLIENT);
  });

  describe('getActive', () => {
    it('returns cached prompt without hitting the DB', async () => {
      const prompt = makePrompt();
      redis.get.mockResolvedValue(JSON.stringify(prompt));

      const result = await service.getActive('generate_profile');

      expect(result.id).toBe('p1');
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('fetches from DB on cache miss', async () => {
      redis.get.mockResolvedValue(null);
      const prompt = makePrompt();
      repo.findOne.mockResolvedValue(prompt);

      const result = await service.getActive('generate_profile');

      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: 'generate_profile', isActive: true },
        }),
      );
      expect(result.id).toBe('p1');
    });

    it('writes DB result to Redis with 1hr TTL on cache miss', async () => {
      redis.get.mockResolvedValue(null);
      const prompt = makePrompt();
      repo.findOne.mockResolvedValue(prompt);

      await service.getActive('generate_profile');

      expect(redis.set).toHaveBeenCalledWith(
        'prompt:generate_profile:active',
        JSON.stringify(prompt),
        'EX',
        3600,
      );
    });

    it('throws NotFoundException when no active prompt exists in DB', async () => {
      redis.get.mockResolvedValue(null);
      repo.findOne.mockResolvedValue(null);

      await expect(service.getActive('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('uses the correct cache key per prompt name', async () => {
      redis.get.mockResolvedValue(null);
      repo.findOne.mockResolvedValue(makePrompt({ name: 'qa_prompt' }));

      await service.getActive('qa_prompt');

      expect(redis.get).toHaveBeenCalledWith('prompt:qa_prompt:active');
    });
  });

  describe('render', () => {
    it('replaces a single template variable', () => {
      expect(service.render('Hello {{name}}!', { name: 'Praise' })).toBe(
        'Hello Praise!',
      );
    });

    it('replaces multiple template variables', () => {
      const result = service.render('Hi {{name}}, welcome to {{platform}}.', {
        name: 'Praise',
        platform: 'LinkedIn',
      });
      expect(result).toBe('Hi Praise, welcome to LinkedIn.');
    });

    it('replaces all occurrences of the same variable', () => {
      const result = service.render('{{x}} and {{x}}', { x: 'yes' });
      expect(result).toBe('yes and yes');
    });

    it('leaves unknown placeholders unchanged', () => {
      expect(service.render('Hello {{name}}', { other: 'value' })).toBe(
        'Hello {{name}}',
      );
    });

    it('returns the template unchanged when variables map is empty', () => {
      expect(service.render('Hello {{name}}', {})).toBe('Hello {{name}}');
    });
  });
});
