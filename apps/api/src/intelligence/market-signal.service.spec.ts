import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from '../shared';
import { REDIS_CLIENT } from '../redis';
import { MarketSignalService } from './market-signal.service';

const mockRedis = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
});

const mockConfig = () => ({
  get: jest.fn().mockReturnValue('test-key'),
});

const adzunaResponse = {
  results: [
    { title: 'TypeScript Developer' },
    { title: 'NestJS Engineer' },
    { title: 'React TypeScript Dev' },
  ],
};

const joobleResponse = {
  jobs: [
    { title: 'Senior TypeScript Engineer' },
    { title: 'NestJS Backend Developer' },
  ],
};

const remotiveResponse = {
  jobs: [
    { tags: ['typescript', 'nestjs', 'node.js'] },
    { tags: ['typescript', 'react'] },
  ],
};

const mockCb = {
  wrap: jest
    .fn()
    .mockImplementation(
      (_name: string, fn: (...args: unknown[]) => Promise<unknown>) => fn,
    ),
};

describe('MarketSignalService', () => {
  let service: MarketSignalService;
  let redis: ReturnType<typeof mockRedis>;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    redis = mockRedis();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketSignalService,
        { provide: REDIS_CLIENT, useFactory: mockRedis },
        { provide: ConfigService, useFactory: mockConfig },
        { provide: CircuitBreakerService, useValue: mockCb },
      ],
    }).compile();

    service = module.get(MarketSignalService);
    redis = module.get(REDIS_CLIENT);

    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(adzunaResponse),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(joobleResponse),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(remotiveResponse),
      } as unknown as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('cache hit', () => {
    it('returns cached data without calling any API', async () => {
      redis.get.mockResolvedValue(JSON.stringify(['typescript', 'nestjs']));

      const result = await service.fetchSignals(
        'linkedin',
        'Software Engineer',
      );

      expect(result).toEqual(['typescript', 'nestjs']);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('cache miss', () => {
    it('calls all three APIs in parallel on cache miss', async () => {
      redis.get.mockResolvedValue(null);

      await service.fetchSignals('linkedin', 'TypeScript Developer');

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      const urls = fetchSpy.mock.calls.map(([url]: [string]) => url);
      expect(urls.some((u) => u.includes('adzuna.com'))).toBe(true);
      expect(urls.some((u) => u.includes('jooble.org'))).toBe(true);
      expect(urls.some((u) => u.includes('remotive.com'))).toBe(true);
    });

    it('returns top 10 aggregated skills sorted by frequency', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.fetchSignals(
        'linkedin',
        'TypeScript Developer',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
      // typescript appears in all three sources — must rank first
      expect(result[0]).toBe('typescript');
    });

    it('stores the result in Redis with 24h TTL', async () => {
      redis.get.mockResolvedValue(null);

      await service.fetchSignals('linkedin', 'TypeScript Developer');

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('market:linkedin:'),
        expect.any(String),
        'EX',
        86400,
      );
    });
  });

  describe('failure handling', () => {
    it('returns empty array and logs warning when all three APIs fail', async () => {
      fetchSpy.mockReset().mockRejectedValue(new Error('Network error'));
      redis.get.mockResolvedValue(null);

      const warnSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockReturnValue(undefined);

      const result = await service.fetchSignals('linkedin', 'Developer');

      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('All market signal APIs failed'),
      );
    });

    it('still returns results when only one API succeeds', async () => {
      fetchSpy
        .mockReset()
        .mockRejectedValueOnce(new Error('Adzuna down'))
        .mockRejectedValueOnce(new Error('Jooble down'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(remotiveResponse),
        });
      redis.get.mockResolvedValue(null);

      const result = await service.fetchSignals('github', 'Developer');

      expect(result).not.toHaveLength(0);
      expect(result).toContain('typescript');
    });

    it('does not store empty results in Redis when all APIs fail', async () => {
      fetchSpy.mockReset().mockRejectedValue(new Error('Network error'));
      redis.get.mockResolvedValue(null);

      jest.spyOn(service['logger'], 'warn').mockReturnValue(undefined);
      await service.fetchSignals('linkedin', 'Developer');

      expect(redis.set).not.toHaveBeenCalled();
    });
  });
});
