import { OAuthStateStore } from './oauth-state.store';

describe('OAuthStateStore', () => {
  let store: OAuthStateStore;
  let redis: {
    set: jest.Mock;
    getdel: jest.Mock;
  };

  beforeEach(() => {
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      getdel: jest.fn().mockResolvedValue('1'),
    };
    store = new OAuthStateStore(redis as never);
  });

  it('stores a nonce in Redis and returns it', async () => {
    const nonce = await new Promise<string>((resolve, reject) => {
      store.store({}, undefined, {}, (err, state) => {
        if (err) reject(err);
        else resolve(state!);
      });
    });

    expect(nonce).toHaveLength(64);
    expect(redis.set).toHaveBeenCalledWith(
      `oauth:state:${nonce}`,
      '1',
      'EX',
      600,
    );
  });

  it('verifies and consumes a valid state once', async () => {
    const ok = await new Promise<boolean>((resolve, reject) => {
      store.verify({}, 'abc123', (err, valid) => {
        if (err) reject(err);
        else resolve(valid);
      });
    });

    expect(ok).toBe(true);
    expect(redis.getdel).toHaveBeenCalledWith('oauth:state:abc123');
  });

  it('rejects missing or unknown state', async () => {
    redis.getdel.mockResolvedValueOnce(null);

    const ok = await new Promise<boolean>((resolve, reject) => {
      store.verify({}, 'missing', (err, valid) => {
        if (err) reject(err);
        else resolve(valid);
      });
    });

    expect(ok).toBe(false);
  });
});
