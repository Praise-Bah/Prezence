import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  RATE_LIMIT_KEY,
  type RateLimitOptions,
} from '../decorators/rate-limit.decorator';
import type { AuthenticatedUser } from '../jwt-payload.interface';
import { RateLimitService } from '../rate-limit.service';

const ANONYMOUS_LIMIT = 20;
const AUTHENTICATED_LIMIT = 100;
const WINDOW_SECONDS = 15 * 60;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const ip = request.ip ?? 'unknown';

    const override = this.reflector.getAllAndOverride<
      RateLimitOptions | undefined
    >(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]);

    if (override) {
      const allowed = await this.rateLimitService.consume(
        `ratelimit:auth:${ip}`,
        override.limit,
        override.ttlSeconds,
      );
      if (!allowed) {
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return true;
    }

    const userId = request.user?.userId;
    const key = userId ? `ratelimit:user:${userId}` : `ratelimit:ip:${ip}`;
    const limit = userId ? AUTHENTICATED_LIMIT : ANONYMOUS_LIMIT;

    const allowed = await this.rateLimitService.consume(
      key,
      limit,
      WINDOW_SECONDS,
    );
    if (!allowed) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
