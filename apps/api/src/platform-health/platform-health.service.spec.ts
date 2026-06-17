import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { PlatformConnection } from '../integration';
import { TokenVaultService } from '../integration';
import { GithubChecker } from './checkers/github.checker';
import { PlatformHealthCheck } from './entities/platform-health-check.entity';
import { PlatformHealthService } from './platform-health.service';

const mockConnectionRepo = () => ({
  find: jest.fn(),
  update: jest.fn(),
});

const mockHealthRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockTokenVault = () => ({
  decrypt: jest.fn().mockReturnValue('decrypted-token'),
});

const mockGithubChecker = () => ({
  check: jest.fn(),
});

const mockRedis = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
});

describe('PlatformHealthService', () => {
  let service: PlatformHealthService;
  let connectionRepo: ReturnType<typeof mockConnectionRepo>;
  let healthRepo: ReturnType<typeof mockHealthRepo>;
  let githubChecker: ReturnType<typeof mockGithubChecker>;
  let redis: ReturnType<typeof mockRedis>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PlatformHealthService,
        {
          provide: getRepositoryToken(PlatformConnection),
          useFactory: mockConnectionRepo,
        },
        {
          provide: getRepositoryToken(PlatformHealthCheck),
          useFactory: mockHealthRepo,
        },
        { provide: TokenVaultService, useFactory: mockTokenVault },
        { provide: GithubChecker, useFactory: mockGithubChecker },
        { provide: REDIS_CLIENT, useFactory: mockRedis },
      ],
    }).compile();

    service = module.get(PlatformHealthService);
    connectionRepo = module.get(getRepositoryToken(PlatformConnection));
    healthRepo = module.get(getRepositoryToken(PlatformHealthCheck));
    githubChecker = module.get(GithubChecker);
    redis = module.get(REDIS_CLIENT);
  });

  describe('checkAll', () => {
    it('returns cached result without hitting checker', async () => {
      redis.get.mockResolvedValue(
        JSON.stringify([{ platform: 'github', status: 'healthy' }]),
      );
      const result = await service.checkAll('user-1');
      expect(result[0].status).toBe('healthy');
      expect(connectionRepo.find).not.toHaveBeenCalled();
    });

    it('runs checks and caches when cache is empty', async () => {
      const conn = {
        id: 'conn-1',
        platform: 'github',
        status: 'active',
        accessTokenCiphertext: 'c',
        accessTokenIv: 'i',
        accessTokenTag: 't',
      };
      connectionRepo.find.mockResolvedValue([conn]);
      githubChecker.check.mockResolvedValue({
        status: 'healthy',
        responseMs: 120,
        errorMessage: null,
      });
      const savedCheck = { checkedAt: new Date() };
      healthRepo.create.mockReturnValue(savedCheck);
      healthRepo.save.mockResolvedValue(savedCheck);

      const result = await service.checkAll('user-1');
      expect(result[0].status).toBe('healthy');
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('checkOne', () => {
    it('marks connection as expired when github returns token_expired', async () => {
      const conn = {
        id: 'conn-1',
        platform: 'github' as const,
        accessTokenCiphertext: 'c',
        accessTokenIv: 'i',
        accessTokenTag: 't',
      };
      githubChecker.check.mockResolvedValue({
        status: 'token_expired',
        responseMs: 50,
        errorMessage: 'Token rejected',
      });
      const savedCheck = { checkedAt: new Date() };
      healthRepo.create.mockReturnValue(savedCheck);
      healthRepo.save.mockResolvedValue(savedCheck);

      const result = await service.checkOne(
        'user-1',
        conn as PlatformConnection,
      );
      expect(result.status).toBe('token_expired');
      expect(connectionRepo.update).toHaveBeenCalledWith('conn-1', {
        status: 'expired',
      });
    });

    it('returns healthy for non-github L3A platforms without calling checker', async () => {
      const conn = {
        id: 'conn-2',
        platform: 'instagram' as const,
        accessTokenCiphertext: 'c',
        accessTokenIv: 'i',
        accessTokenTag: 't',
      };
      const savedCheck = { checkedAt: new Date() };
      healthRepo.create.mockReturnValue(savedCheck);
      healthRepo.save.mockResolvedValue(savedCheck);

      const result = await service.checkOne(
        'user-1',
        conn as PlatformConnection,
      );
      expect(result.status).toBe('healthy');
      expect(githubChecker.check).not.toHaveBeenCalled();
    });
  });

  describe('getLatest', () => {
    it('returns empty array when user has no connections', async () => {
      connectionRepo.find.mockResolvedValue([]);
      const result = await service.getLatest('user-1');
      expect(result).toEqual([]);
    });

    it('returns latest check per platform', async () => {
      connectionRepo.find.mockResolvedValue([{ platform: 'github' }]);
      const check = {
        platform: 'github',
        status: 'healthy',
        responseMs: 80,
        checkedAt: new Date(),
        errorMessage: null,
      };
      const qb = {
        where: jest.fn().mockReturnThis(),
        distinctOn: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([check]),
      };
      (healthRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.getLatest('user-1');
      expect(result[0].platform).toBe('github');
      expect(result[0].status).toBe('healthy');
    });
  });
});
