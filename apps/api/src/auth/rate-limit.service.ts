import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis';

@Injectable()
export class RateLimitService {
  private static readonly INCR_WITH_TTL_SCRIPT = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Increments the counter for `key` and returns whether the request should
   * be allowed, given a max `limit` within `ttlSeconds`.
   */
  async consume(
    key: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<boolean> {
    const count = (await this.redis.eval(
      RateLimitService.INCR_WITH_TTL_SCRIPT,
      1,
      key,
      ttlSeconds,
    )) as number;

    return count <= limit;
  }
}
