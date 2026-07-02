import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@prezence/config';
import type { CheckResult } from './github.checker';

const QUEUE_DEPTH_THRESHOLD = 50;

@Injectable()
export class FiverrChecker {
  constructor(
    @InjectQueue(QUEUE_NAMES.automation)
    private readonly automationQueue: Queue,
  ) {}

  async check(): Promise<CheckResult> {
    const start = Date.now();
    try {
      const [waiting, active] = await Promise.all([
        this.automationQueue.getWaitingCount(),
        this.automationQueue.getActiveCount(),
      ]);
      const depth = waiting + active;
      const responseMs = Date.now() - start;

      if (depth >= QUEUE_DEPTH_THRESHOLD) {
        return {
          status: 'degraded',
          responseMs,
          errorMessage: `Automation queue depth ${depth} exceeds threshold of ${QUEUE_DEPTH_THRESHOLD}`,
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
