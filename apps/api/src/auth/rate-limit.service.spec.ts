import { Test, TestingModule } from '@nestjs/testing';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redis: { incr: jest.Mock; expire: jest.Mock };

  beforeEach(async () => {
    redis = { incr: jest.fn(), expire: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitService, { provide: REDIS_CLIENT, useValue: redis }],
    }).compile();

    service = module.get(RateLimitService);
  });

  it('sets a TTL on the first request for a key', async () => {
    redis.incr.mockResolvedValue(1);

    await service.consume('ratelimit:ip:1.2.3.4', 20, 900);

    expect(redis.expire).toHaveBeenCalledWith('ratelimit:ip:1.2.3.4', 900);
  });

  it('returns true when count is within the limit', async () => {
    redis.incr.mockResolvedValue(5);

    expect(await service.consume('ratelimit:ip:1.2.3.4', 20, 900)).toBe(true);
  });

  it('returns false when count exceeds the limit', async () => {
    redis.incr.mockResolvedValue(21);

    expect(await service.consume('ratelimit:ip:1.2.3.4', 20, 900)).toBe(false);
  });

  it('does not reset TTL on subsequent requests', async () => {
    redis.incr.mockResolvedValue(2);

    await service.consume('ratelimit:ip:1.2.3.4', 20, 900);

    expect(redis.expire).not.toHaveBeenCalled();
  });
});
