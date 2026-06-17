import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 15 * 60;

@Injectable()
export class LockoutService {
  private static readonly INCR_WITH_TTL_SCRIPT = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private failsKey(email: string): string {
    return `lockout:fails:${email}`;
  }

  private lockedKey(email: string): string {
    return `lockout:locked:${email}`;
  }

  async isLocked(email: string): Promise<boolean> {
    const locked = await this.redis.get(this.lockedKey(email));
    return locked !== null;
  }

  async recordFailure(email: string): Promise<void> {
    const fails = (await this.redis.eval(
      LockoutService.INCR_WITH_TTL_SCRIPT,
      1,
      this.failsKey(email),
      LOCKOUT_TTL_SECONDS,
    )) as number;

    if (fails >= MAX_FAILED_ATTEMPTS) {
      await this.redis.set(
        this.lockedKey(email),
        '1',
        'EX',
        LOCKOUT_TTL_SECONDS,
      );
    }
  }

  async reset(email: string): Promise<void> {
    await this.redis.del(this.failsKey(email), this.lockedKey(email));
  }
}
