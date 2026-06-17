import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '../entities/platform-health-check.entity';

export interface CheckResult {
  status: HealthStatus;
  responseMs: number | null;
  errorMessage: string | null;
}

@Injectable()
export class GithubChecker {
  async check(accessToken: string): Promise<CheckResult> {
    const start = Date.now();
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      const responseMs = Date.now() - start;

      if (res.status === 401) {
        return {
          status: 'token_expired',
          responseMs,
          errorMessage: 'Token rejected by GitHub (401)',
        };
      }
      if (!res.ok) {
        return {
          status: 'degraded',
          responseMs,
          errorMessage: `GitHub returned ${res.status}`,
        };
      }
      return { status: 'healthy', responseMs, errorMessage: null };
    } catch (err) {
      return {
        status: 'unreachable',
        responseMs: null,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
