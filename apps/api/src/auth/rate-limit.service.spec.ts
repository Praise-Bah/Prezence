import { Test, TestingModule } from '@nestjs/testing';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redis: { eval: jest.Mock };

  beforeEach(async () => {
    redis = { eval: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitService, { provide: REDIS_CLIENT, useValue: redis }],
    }).compile();

    service = module.get(RateLimitService);
  });

  it('calls eval with the Lua script, key, and TTL', async () => {
    redis.eval.mockResolvedValue(1);

    await service.consume('ratelimit:ip:1.2.3.4', 20, 900);

    expect(redis.eval).toHaveBeenCalledWith(
      expect.any(String),
      1,
      'ratelimit:ip:1.2.3.4',
      900,
    );
  });

  it('returns true when count is within the limit', async () => {
    redis.eval.mockResolvedValue(5);
    expect(await service.consume('ratelimit:ip:1.2.3.4', 20, 900)).toBe(true);
  });

  it('returns false when count exceeds the limit', async () => {
    redis.eval.mockResolvedValue(21);
    expect(await service.consume('ratelimit:ip:1.2.3.4', 20, 900)).toBe(false);
  });

  it('returns false at exactly limit + 1', async () => {
    redis.eval.mockResolvedValue(21);
    expect(await service.consume('ratelimit:ip:1.2.3.4', 20, 900)).toBe(false);
  });
});
