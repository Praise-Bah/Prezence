import { Test, TestingModule } from '@nestjs/testing';
import { LockoutService } from './lockout.service';
import { REDIS_CLIENT } from '../redis/redis.constants';

describe('LockoutService', () => {
  let service: LockoutService;
  let redis: { get: jest.Mock; eval: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      eval: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LockoutService, { provide: REDIS_CLIENT, useValue: redis }],
    }).compile();

    service = module.get(LockoutService);
  });

  describe('isLocked', () => {
    it('returns true when the lock key exists', async () => {
      redis.get.mockResolvedValue('1');
      expect(await service.isLocked('a@b.com')).toBe(true);
      expect(redis.get).toHaveBeenCalledWith('lockout:locked:a@b.com');
    });

    it('returns false when the lock key is absent', async () => {
      redis.get.mockResolvedValue(null);
      expect(await service.isLocked('a@b.com')).toBe(false);
    });
  });

  describe('recordFailure', () => {
    it('calls eval atomically with key and TTL', async () => {
      redis.eval.mockResolvedValue(1);

      await service.recordFailure('a@b.com');

      expect(redis.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'lockout:fails:a@b.com',
        15 * 60,
      );
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('locks the account once the failure threshold is reached', async () => {
      redis.eval.mockResolvedValue(5);

      await service.recordFailure('a@b.com');

      expect(redis.set).toHaveBeenCalledWith(
        'lockout:locked:a@b.com',
        '1',
        'EX',
        15 * 60,
      );
    });

    it('does not lock below the threshold', async () => {
      redis.eval.mockResolvedValue(2);

      await service.recordFailure('a@b.com');

      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('deletes both the failure counter and the lock key', async () => {
      await service.reset('a@b.com');
      expect(redis.del).toHaveBeenCalledWith(
        'lockout:fails:a@b.com',
        'lockout:locked:a@b.com',
      );
    });
  });
});
