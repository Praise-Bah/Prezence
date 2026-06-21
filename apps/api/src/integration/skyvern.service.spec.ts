import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../shared';
import { SkyvernService } from './skyvern.service';

const FAKE_API_URL = 'http://localhost:8000';
const FAKE_API_KEY = 'test-api-key';

const mockConfigService = {
  get: (key: string) => (key === 'SKYVERN_API_URL' ? FAKE_API_URL : undefined),
  getOrThrow: (key: string) => {
    if (key === 'SKYVERN_API_KEY') return FAKE_API_KEY;
    throw new Error(`Unknown config key: ${key}`);
  },
};

const mockCb = {
  wrap: jest
    .fn()
    .mockImplementation(
      (_name: string, fn: (...args: unknown[]) => Promise<unknown>) => fn,
    ),
};

describe('SkyvernService', () => {
  let service: SkyvernService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SkyvernService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CircuitBreakerService, useValue: mockCb },
      ],
    }).compile();
    service = module.get(SkyvernService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('runTask', () => {
    it('returns task_id on a successful Skyvern response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ task_id: 'skyvern-abc-123' }),
      });

      const result = await service.runTask({
        startUrl: 'https://www.fiverr.com/users/alice/manage_gigs',
        goal: 'Update the Fiverr profile tagline.',
        formData: { tagline: 'Expert developer' },
        webhookUrl: 'https://api.prezence.cm/integration/skyvern/webhook',
      });

      expect(result.task_id).toBe('skyvern-abc-123');
      expect(global.fetch).toHaveBeenCalledWith(
        `${FAKE_API_URL}/api/v1/tasks`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'x-api-key': FAKE_API_KEY }),
        }),
      );
    });
  });

  describe('waitForCompletion', () => {
    it('returns immediately when task is already completed', async () => {
      const completedTask = {
        task_id: 't-1',
        status: 'completed' as const,
        screenshot_url: 'https://s3.example.com/screenshot.png',
        failure_reason: null,
      };
      jest.spyOn(service, 'getTaskStatus').mockResolvedValue(completedTask);

      const result = await service.waitForCompletion('t-1', 60_000);

      expect(result.status).toBe('completed');
      expect(service.getTaskStatus).toHaveBeenCalledTimes(1);
    });

    it('throws when the timeout deadline is exceeded before completion', async () => {
      // timeoutMs=0 means deadline = Date.now(); the while condition is false immediately
      await expect(service.waitForCompletion('t-1', 0)).rejects.toThrow(
        'did not complete within',
      );
    });
  });
});
