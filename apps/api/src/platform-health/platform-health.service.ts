import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { CACHE_TTL } from '@prezence/config';
import type { SupportedPlatform } from '@prezence/types';
import { PlatformConnection, TokenVaultService } from '../integration';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { GithubChecker } from './checkers/github.checker';
import { PlatformHealthCheck } from './entities/platform-health-check.entity';
import type { HealthStatus } from './entities/platform-health-check.entity';

export interface PlatformHealthSummary {
  platform: SupportedPlatform;
  status: HealthStatus;
  responseMs: number | null;
  checkedAt: Date;
  errorMessage: string | null;
}

@Injectable()
export class PlatformHealthService {
  private readonly logger = new Logger(PlatformHealthService.name);

  constructor(
    @InjectRepository(PlatformConnection)
    private readonly connectionRepo: Repository<PlatformConnection>,
    @InjectRepository(PlatformHealthCheck)
    private readonly healthRepo: Repository<PlatformHealthCheck>,
    private readonly tokenVault: TokenVaultService,
    private readonly githubChecker: GithubChecker,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async checkAll(userId: string): Promise<PlatformHealthSummary[]> {
    const cacheKey = `platform_health:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as PlatformHealthSummary[];
    }

    const connections = await this.connectionRepo.find({
      where: { userId, status: 'active' },
    });

    const results = await Promise.all(
      connections.map((conn) => this.checkOne(userId, conn)),
    );

    await this.redis.set(
      cacheKey,
      JSON.stringify(results),
      'EX',
      CACHE_TTL.platform_health,
    );

    return results;
  }

  async checkOne(
    userId: string,
    connection: PlatformConnection,
  ): Promise<PlatformHealthSummary> {
    const { platform } = connection;
    let result: {
      status: HealthStatus;
      responseMs: number | null;
      errorMessage: string | null;
    };

    try {
      const accessToken = this.tokenVault.decrypt(
        connection.accessTokenCiphertext,
        connection.accessTokenIv,
        connection.accessTokenTag,
      );

      if (platform === 'github') {
        result = await this.githubChecker.check(accessToken);
      } else {
        // L3A platforms — no API check available yet, report as healthy if connected
        result = { status: 'healthy', responseMs: null, errorMessage: null };
      }
    } catch (err) {
      result = {
        status: 'unreachable',
        responseMs: null,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }

    // Persist the health check result; use the returned entity so @CreateDateColumn is populated
    const check = this.healthRepo.create({
      userId,
      platform,
      status: result.status,
      responseMs: result.responseMs,
      errorMessage: result.errorMessage,
    });
    const saved = await this.healthRepo.save(check);

    // Mark connection as expired if token was rejected
    if (result.status === 'token_expired') {
      await this.connectionRepo.update(connection.id, { status: 'expired' });
      this.logger.warn(
        `Token expired for ${platform} — connection ${connection.id} marked expired`,
      );
    }

    return {
      platform,
      status: result.status,
      responseMs: result.responseMs,
      checkedAt: saved.checkedAt,
      errorMessage: result.errorMessage,
    };
  }

  async getLatest(userId: string): Promise<PlatformHealthSummary[]> {
    const connections = await this.connectionRepo.find({
      where: { userId, status: 'active' },
    });
    if (connections.length === 0) return [];

    // Single query: latest check per platform using DISTINCT ON
    const rows = await this.healthRepo
      .createQueryBuilder('h')
      .where('h.userId = :userId', { userId })
      .distinctOn(['h.platform'])
      .orderBy('h.platform', 'ASC')
      .addOrderBy('h.checkedAt', 'DESC')
      .getMany();

    return rows.map((r) => ({
      platform: r.platform,
      status: r.status,
      responseMs: r.responseMs,
      checkedAt: r.checkedAt,
      errorMessage: r.errorMessage,
    }));
  }
}
