import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  private readonly breakers = new Map<string, CircuitBreaker<any[], any>>();

  private readonly wrappers = new Map<
    string,
    (...args: any[]) => Promise<any>
  >();

  wrap<TArgs extends unknown[], TResult>(
    name: string,
    fn: (...args: TArgs) => Promise<TResult>,
    options: CircuitBreakerOptions = {},
  ): (...args: TArgs) => Promise<TResult> {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(fn, {
        timeout: options.timeout ?? 30_000,
        errorThresholdPercentage: options.errorThresholdPercentage ?? 50,
        resetTimeout: options.resetTimeout ?? 60_000,
        volumeThreshold: options.volumeThreshold ?? 5,
      });

      breaker.on('open', () =>
        this.logger.warn(`Circuit OPEN: ${name} — failing fast`),
      );
      breaker.on('halfOpen', () =>
        this.logger.log(`Circuit HALF-OPEN: ${name} — probing`),
      );
      breaker.on('close', () =>
        this.logger.log(`Circuit CLOSED: ${name} — recovered`),
      );

      this.breakers.set(name, breaker);

      const wrapper = (...args: TArgs): Promise<TResult> =>
        breaker.fire(...args);
      this.wrappers.set(name, wrapper);
    }

    return this.wrappers.get(name) as (...args: TArgs) => Promise<TResult>;
  }

  getHealth(): Record<string, string> {
    const health: Record<string, string> = {};
    for (const [name, breaker] of this.breakers) {
      health[name] = breaker.opened
        ? 'open'
        : breaker.halfOpen
          ? 'half-open'
          : 'closed';
    }
    return health;
  }
}
