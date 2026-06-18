import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ModelRouterService } from './services/model-router.service';

const mockConfigService = () => ({
  getOrThrow: jest.fn().mockReturnValue('test-api-key'),
});

describe('ModelRouterService', () => {
  let service: ModelRouterService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ModelRouterService,
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get(ModelRouterService);
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('generate', () => {
    it('returns content and token counts on success', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'generated bio' } }],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 20,
              total_tokens: 30,
            },
          }),
      } as Response);

      const result = await service.generate('claude-sonnet', [
        { role: 'user', content: 'write my bio' },
      ]);

      expect(result.content).toBe('generated bio');
      expect(result.promptTokens).toBe(10);
      expect(result.completionTokens).toBe(20);
      expect(result.totalTokens).toBe(30);
    });

    it('throws on non-ok response', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      } as Response);

      await expect(service.generate('claude-sonnet', [])).rejects.toThrow(
        'OpenRouter API error: 401',
      );
    });
  });

  describe('embed', () => {
    it('returns embedding vector and token count', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
            usage: { total_tokens: 5 },
          }),
      } as Response);

      const result = await service.embed('hello world', 'embed-model');

      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result.tokenCount).toBe(5);
    });

    it('throws on non-ok embed response', async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited'),
      } as Response);

      await expect(service.embed('text', 'model')).rejects.toThrow(
        'OpenRouter embed error: 429',
      );
    });
  });
});
