import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { CACHE_TTL } from '@prezence/config';
import type { SupportedPlatform } from '@prezence/types';
import { REDIS_CLIENT } from '../redis';
import { CircuitBreakerService } from '../shared';

@Injectable()
export class MarketSignalService {
  private readonly logger = new Logger(MarketSignalService.name);

  private readonly fireAdzuna: (role: string) => Promise<string[]>;
  private readonly fireJooble: (role: string) => Promise<string[]>;
  private readonly fireRemotive: (role: string) => Promise<string[]>;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly cb: CircuitBreakerService,
  ) {
    this.fireAdzuna = cb.wrap(
      'market-adzuna',
      (role) => this.fetchAdzuna(role),
      { timeout: 10_000, volumeThreshold: 3 },
    );
    this.fireJooble = cb.wrap(
      'market-jooble',
      (role) => this.fetchJooble(role),
      { timeout: 10_000, volumeThreshold: 3 },
    );
    this.fireRemotive = cb.wrap(
      'market-remotive',
      (role) => this.fetchRemotive(role),
      { timeout: 10_000, volumeThreshold: 3 },
    );
  }

  async fetchSignals(
    platform: SupportedPlatform,
    role: string,
  ): Promise<string[]> {
    const normalizedRole = role.trim().toLowerCase().replace(/\s+/g, '_');
    const cacheKey = `market:${platform}:${normalizedRole}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    const [adzuna, jooble, remotive] = await Promise.allSettled([
      this.fireAdzuna(role),
      this.fireJooble(role),
      this.fireRemotive(role),
    ]);

    const allSkills: string[] = [];
    let successCount = 0;

    if (adzuna.status === 'fulfilled') {
      allSkills.push(...adzuna.value);
      successCount++;
    } else {
      this.logger.warn(`Adzuna failed: ${String(adzuna.reason)}`);
    }

    if (jooble.status === 'fulfilled') {
      allSkills.push(...jooble.value);
      successCount++;
    } else {
      this.logger.warn(`Jooble failed: ${String(jooble.reason)}`);
    }

    if (remotive.status === 'fulfilled') {
      allSkills.push(...remotive.value);
      successCount++;
    } else {
      this.logger.warn(`Remotive failed: ${String(remotive.reason)}`);
    }

    if (successCount === 0) {
      this.logger.warn(
        `All market signal APIs failed for role "${role}" — proceeding without signals`,
      );
      return [];
    }

    const top10 = this.aggregateTop10(allSkills);
    await this.redis.set(
      cacheKey,
      JSON.stringify(top10),
      'EX',
      CACHE_TTL.market_signals,
    );
    return top10;
  }

  private aggregateTop10(skills: string[]): string[] {
    const freq = new Map<string, number>();
    for (const skill of skills) {
      const s = skill.trim().toLowerCase();
      if (s.length > 2) {
        freq.set(s, (freq.get(s) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);
  }

  private async fetchAdzuna(role: string): Promise<string[]> {
    const appId = this.config.get<string>('ADZUNA_APP_ID') ?? '';
    const appKey = this.config.get<string>('ADZUNA_APP_KEY') ?? '';

    const url = new URL('https://api.adzuna.com/v1/api/jobs/cm/search/1');
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);
    url.searchParams.set('what', role);
    url.searchParams.set('results_per_page', '20');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Adzuna API ${res.status}`);

    const data = (await res.json()) as { results?: Array<{ title: string }> };
    const skills: string[] = [];
    for (const job of data.results ?? []) {
      skills.push(...job.title.split(/[\s,/]+/).filter((w) => w.length > 2));
    }
    return skills;
  }

  private async fetchJooble(role: string): Promise<string[]> {
    const apiKey = this.config.get<string>('JOOBLE_API_KEY') ?? '';

    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: role, location: 'Cameroon' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Jooble API ${res.status}`);

    const data = (await res.json()) as { jobs?: Array<{ title: string }> };
    const skills: string[] = [];
    for (const job of data.jobs ?? []) {
      skills.push(...job.title.split(/[\s,/]+/).filter((w) => w.length > 2));
    }
    return skills;
  }

  private async fetchRemotive(role: string): Promise<string[]> {
    const url = new URL('https://remotive.com/api/remote-jobs');
    url.searchParams.set('search', role);
    url.searchParams.set('limit', '20');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Remotive API ${res.status}`);

    const data = (await res.json()) as { jobs?: Array<{ tags: string[] }> };
    const skills: string[] = [];
    for (const job of data.jobs ?? []) {
      skills.push(...(job.tags ?? []));
    }
    return skills;
  }
}
