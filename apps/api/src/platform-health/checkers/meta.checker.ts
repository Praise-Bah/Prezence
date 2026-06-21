import { Injectable } from '@nestjs/common';
import type { CheckResult } from './github.checker';

@Injectable()
export class MetaChecker {
  async check(accessToken: string): Promise<CheckResult> {
    const start = Date.now();
    try {
      const res = await fetch('https://graph.facebook.com/v18.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5000),
      });
      const responseMs = Date.now() - start;

      if (res.status === 401) {
        return {
          status: 'token_expired',
          responseMs,
          errorMessage: 'Meta token rejected (401)',
        };
      }
      if (!res.ok) {
        return {
          status: 'degraded',
          responseMs,
          errorMessage: `Meta Graph API returned ${res.status}`,
        };
      }
      return { status: 'healthy', responseMs, errorMessage: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTimeout = msg.includes('abort') || msg.includes('timeout');
      return {
        status: isTimeout ? 'degraded' : 'unreachable',
        responseMs: null,
        errorMessage: isTimeout ? 'Request timed out' : msg,
      };
    }
  }
}
