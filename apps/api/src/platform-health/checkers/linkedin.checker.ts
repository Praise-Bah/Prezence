import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CheckResult } from './github.checker';

@Injectable()
export class LinkedInChecker {
  constructor(private readonly config: ConfigService) {}

  async check(): Promise<CheckResult> {
    const webhookUrl = this.config.get<string>('MAKE_WEBHOOK_URL_LINKEDIN');
    if (!webhookUrl) {
      return {
        status: 'healthy',
        responseMs: null,
        errorMessage: 'LinkedIn webhook not configured',
      };
    }

    const start = Date.now();
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'health_check' }),
        signal: AbortSignal.timeout(5000),
      });
      const responseMs = Date.now() - start;

      if (res.ok) {
        return { status: 'healthy', responseMs, errorMessage: null };
      }
      return {
        status: 'degraded',
        responseMs,
        errorMessage: `Make.com webhook returned ${res.status}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { status: 'degraded', responseMs: null, errorMessage: msg };
    }
  }
}
