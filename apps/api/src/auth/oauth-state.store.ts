import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis';

const KEY_PREFIX = 'oauth:state:';
const STATE_TTL_SEC = 600;

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (
  err: Error | null,
  ok: boolean,
  appState?: unknown,
) => void;

@Injectable()
export class OAuthStateStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  store(
    _req: unknown,
    _state: unknown,
    _meta: unknown,
    callback: StoreCallback,
  ): void {
    const nonce = randomBytes(32).toString('hex');
    void this.redis
      .set(`${KEY_PREFIX}${nonce}`, '1', 'EX', STATE_TTL_SEC)
      .then(() => callback(null, nonce))
      .catch((err: Error) => callback(err));
  }

  verify(_req: unknown, providedState: string, callback: VerifyCallback): void {
    if (!providedState) {
      callback(null, false, { message: 'Missing OAuth state parameter.' });
      return;
    }

    const key = `${KEY_PREFIX}${providedState}`;
    void this.redis
      .getdel(key)
      .then((value) => {
        if (value === '1') {
          callback(null, true);
          return;
        }
        callback(null, false, { message: 'Invalid OAuth state.' });
      })
      .catch((err: Error) => callback(err, false));
  }
}
