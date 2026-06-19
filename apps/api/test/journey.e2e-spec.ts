/**
 * Full E2E journey: register → login → /auth/me → PATCH /auth/me → logout.
 *
 * External dependencies (DB, Redis, queues) are replaced with in-memory fakes
 * so this spec runs in CI without a live Postgres / Upstash instance.
 */
import { Test } from '@nestjs/testing';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { QUEUE_NAMES } from '@prezence/config';
import { AuthModule, JwtAuthGuard } from '../src/auth';
import { User } from '../src/auth/entities/user.entity';
import { RefreshToken } from '../src/auth/entities/refresh-token.entity';
import { PasswordResetToken } from '../src/auth/entities/password-reset-token.entity';
import { REDIS_CLIENT } from '../src/redis';

// ─── In-memory stores ─────────────────────────────────────────────────────────

const users = new Map<string, User>();
const tokens = new Map<string, RefreshToken>();
const resetTokens = new Map<string, PasswordResetToken>();
const redisKv = new Map<string, string>();

function findUser(where: Partial<User>): User | undefined {
  return [...users.values()].find((u) =>
    Object.entries(where).every(([k, v]) => (u as Record<string, unknown>)[k] === v),
  );
}

function makeUserRepo() {
  return {
    findOne: jest.fn(({ where }: { where: Partial<User> }) =>
      Promise.resolve(findUser(where) ?? null),
    ),
    findOneOrFail: jest.fn(({ where }: { where: Partial<User> }) => {
      const match = findUser(where);
      if (!match) throw new Error('Entity not found');
      return Promise.resolve(match);
    }),
    create: jest.fn((data: Partial<User>) => data as User),
    save: jest.fn((entity: Partial<User>) => {
      const id = entity.id ?? `user-${Date.now()}`;
      const row = {
        id, role: 'user', plan: 'free', countryCode: 'CM', language: 'en',
        name: null, bio: null, location: null, timezone: 'Africa/Douala',
        emailNotifications: true, pushNotifications: true,
        ...entity,
      } as unknown as User;
      users.set(id, row);
      return Promise.resolve(row);
    }),
    update: jest.fn((id: string, data: Partial<User>) => {
      const u = users.get(id);
      if (u) users.set(id, { ...u, ...data });
      return Promise.resolve({ affected: 1 });
    }),
  };
}

function makeTokenRepo() {
  return {
    findOne: jest.fn(({ where }: { where: Partial<RefreshToken> }) => {
      const match = [...tokens.values()].find((t) =>
        Object.entries(where).every(([k, v]) => (t as Record<string, unknown>)[k] === v),
      );
      return Promise.resolve(match ?? null);
    }),
    create: jest.fn((d: Partial<RefreshToken>) => d as RefreshToken),
    save: jest.fn((entity: Partial<RefreshToken>) => {
      const id = entity.id ?? `tok-${Date.now()}`;
      const row = { revokedAt: null, replacedBy: null, ...entity, id } as unknown as RefreshToken;
      tokens.set(id, row);
      return Promise.resolve(row);
    }),
    update: jest.fn((_criteria: unknown, data: Partial<RefreshToken>) => {
      tokens.forEach((t, k) => tokens.set(k, { ...t, ...data } as RefreshToken));
      return Promise.resolve({ affected: tokens.size });
    }),
  };
}

function makeResetTokenRepo() {
  return {
    findOne: jest.fn(({ where }: { where: Partial<PasswordResetToken> }) => {
      const match = [...resetTokens.values()].find((t) =>
        Object.entries(where).every(([k, v]) => (t as Record<string, unknown>)[k] === v),
      );
      return Promise.resolve(match ?? null);
    }),
    create: jest.fn((d: Partial<PasswordResetToken>) => d as PasswordResetToken),
    save: jest.fn((entity: Partial<PasswordResetToken>) => {
      const id = entity.id ?? `rst-${Date.now()}`;
      const row = { usedAt: null, ...entity, id } as unknown as PasswordResetToken;
      resetTokens.set(id, row);
      return Promise.resolve(row);
    }),
    delete: jest.fn(() => Promise.resolve({ affected: 1 })),
  };
}

function makeRedis() {
  return {
    get: jest.fn((k: string) => Promise.resolve(redisKv.get(k) ?? null)),
    set: jest.fn((k: string, v: string) => { redisKv.set(k, v); return Promise.resolve('OK'); }),
    del: jest.fn((...keys: string[]) => { keys.forEach((k) => redisKv.delete(k)); return Promise.resolve(keys.length); }),
    incr: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(1)),
    // Used by LockoutService and RateLimitService — always returns 1 (below any threshold)
    eval: jest.fn(() => Promise.resolve(1)),
  };
}

// ─── Test wrapper module ───────────────────────────────────────────────────────

const passthroughGuard = { canActivate: () => true };

@Module({
  imports: [AuthModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useValue: passthroughGuard },  // RolesGuard — always allow in tests
    { provide: APP_GUARD, useValue: passthroughGuard },  // RateLimitGuard — always allow in tests
  ],
})
class TestAppModule {}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Auth journey (E2E)', () => {
  let app: INestApplication<App>;
  let server: App;

  const email = 'journey@prezence.test';
  const password = 'Journey1234!';
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    users.clear();
    tokens.clear();
    resetTokens.clear();
    redisKv.clear();

    process.env['JWT_SECRET'] = 'test-secret-e2e';
    process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-e2e';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TestAppModule,
      ],
    })
      .overrideProvider(getRepositoryToken(User)).useFactory({ factory: makeUserRepo })
      .overrideProvider(getRepositoryToken(RefreshToken)).useFactory({ factory: makeTokenRepo })
      .overrideProvider(getRepositoryToken(PasswordResetToken)).useFactory({ factory: makeResetTokenRepo })
      .overrideProvider(REDIS_CLIENT).useFactory({ factory: makeRedis })
      .overrideProvider(getQueueToken(QUEUE_NAMES.email)).useValue({ add: jest.fn().mockResolvedValue({ id: 'q1' }) })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
    delete process.env['JWT_SECRET'];
    delete process.env['JWT_REFRESH_SECRET'];
  });

  it('POST /auth/register → 201, returns user + tokens', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(res.body.user).toMatchObject({ email, role: 'user', plan: 'free' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');

    accessToken = res.body.accessToken as string;
    refreshToken = res.body.refreshToken as string;
  });

  it('POST /auth/register → 409 when email already taken', async () => {
    await request(server).post('/auth/register').send({ email, password }).expect(409);
  });

  it('POST /auth/register → 400 with invalid payload', async () => {
    await request(server).post('/auth/register').send({ email: 'not-an-email' }).expect(400);
  });

  it('GET /auth/me → 401 without token', async () => {
    await request(server).get('/auth/me').expect(401);
  });

  it('GET /auth/me → 200 returns authenticated user', async () => {
    const res = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toMatchObject({ email, role: 'user' });
  });

  it('PATCH /auth/me → 200 updates display name', async () => {
    const res = await request(server)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Praise B.' })
      .expect(200);

    expect(res.body).toMatchObject({ name: 'Praise B.' });
  });

  it('POST /auth/login → 201 with correct credentials', async () => {
    // Sync the stored hash with what bcrypt.compare expects
    const storedUser = findUser({ email });
    if (storedUser) {
      storedUser.passwordHash = await bcrypt.hash(password, 10);
    }

    const res = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.user).toMatchObject({ email });
    accessToken = res.body.accessToken as string;
    refreshToken = res.body.refreshToken as string;
  });

  it('POST /auth/login → 401 with wrong password', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email, password: 'WrongPass999!' })
      .expect(401);
  });

  it('POST /auth/logout → 204 without error', async () => {
    await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(204);
  });
});
