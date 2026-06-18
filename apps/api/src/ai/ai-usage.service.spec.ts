import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AI_MODELS } from '@prezence/config';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { AiUsageService } from './services/ai-usage.service';
import { ModelRouterService } from './services/model-router.service';

const mockModelRouter = () => ({
  generate: jest.fn(),
  embed: jest.fn(),
});

const mockUsageRepo = () => ({
  create: jest.fn().mockImplementation((d: unknown) => d),
  save: jest.fn().mockResolvedValue({}),
});

describe('AiUsageService', () => {
  let service: AiUsageService;
  let modelRouter: ReturnType<typeof mockModelRouter>;
  let usageRepo: ReturnType<typeof mockUsageRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiUsageService,
        { provide: ModelRouterService, useFactory: mockModelRouter },
        { provide: getRepositoryToken(AiUsageLog), useFactory: mockUsageRepo },
      ],
    }).compile();

    service = module.get(AiUsageService);
    modelRouter = module.get(ModelRouterService);
    usageRepo = module.get(getRepositoryToken(AiUsageLog));
  });

  describe('generate', () => {
    it('routes generation task to Claude Sonnet', async () => {
      modelRouter.generate.mockResolvedValue({
        content: 'bio text',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });

      const result = await service.generate({
        task: 'generation',
        userId: 'user-1',
        feature: 'profile_generation',
        messages: [{ role: 'user', content: 'generate' }],
      });

      expect(modelRouter.generate).toHaveBeenCalledWith(
        AI_MODELS.generation,
        [{ role: 'user', content: 'generate' }],
        undefined,
      );
      expect(result.content).toBe('bio text');
      expect(result.totalTokens).toBe(30);
    });

    it('routes qa task to Gemini Flash', async () => {
      modelRouter.generate.mockResolvedValue({
        content: '{"quality_score":80}',
        promptTokens: 5,
        completionTokens: 10,
        totalTokens: 15,
      });

      await service.generate({
        task: 'qa',
        userId: 'user-1',
        feature: 'qa_scoring',
        messages: [],
      });

      expect(modelRouter.generate).toHaveBeenCalledWith(
        AI_MODELS.qa,
        [],
        undefined,
      );
    });

    it('logs usage with userId and feature after generate', async () => {
      modelRouter.generate.mockResolvedValue({
        content: 'x',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });

      await service.generate({
        task: 'generation',
        userId: 'user-1',
        feature: 'profile_generation',
        messages: [],
      });

      expect(usageRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          model: AI_MODELS.generation,
          feature: 'profile_generation',
          totalTokens: 30,
        }),
      );
    });

    it('passes max_tokens option to model router', async () => {
      modelRouter.generate.mockResolvedValue({
        content: '',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });

      await service.generate({
        task: 'generation',
        feature: 'profile_generation',
        messages: [],
        options: { max_tokens: 2048 },
      });

      expect(modelRouter.generate).toHaveBeenCalledWith(
        AI_MODELS.generation,
        [],
        { max_tokens: 2048 },
      );
    });
  });

  describe('embed', () => {
    it('calls embed with the embedding model', async () => {
      modelRouter.embed.mockResolvedValue({
        embedding: [0.1, 0.2],
        tokenCount: 5,
      });

      const result = await service.embed({
        userId: 'user-1',
        feature: 'rag_embedding',
        text: 'hello world',
      });

      expect(modelRouter.embed).toHaveBeenCalledWith(
        'hello world',
        AI_MODELS.embedding,
      );
      expect(result.embedding).toEqual([0.1, 0.2]);
    });

    it('logs userId as null when omitted (system-level embedding)', async () => {
      modelRouter.embed.mockResolvedValue({ embedding: [], tokenCount: 3 });

      await service.embed({ feature: 'rag_retrieval', text: 'query' });

      expect(usageRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null, feature: 'rag_retrieval' }),
      );
    });
  });
});
