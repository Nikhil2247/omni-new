// ============================================================================
// PER-USER RATE LIMIT GUARD - Authenticated User Rate Limiting
// ============================================================================
// Enforces rate limits strictly on a per-user basis
// Requires authentication - fails for unauthenticated requests
// ============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitingService, RateLimitConfig } from './rate-limiting.service';
import { PER_USER_RATE_LIMIT_KEY } from './per-user-rate-limit.decorator';

@Injectable()
export class PerUserRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(PerUserRateLimitGuard.name);

  constructor(
    private readonly rateLimitingService: RateLimitingService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get per-user rate limit config from decorator
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(
      PER_USER_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no config, allow (guard not applied)
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Require authentication for per-user rate limiting
    const userId = (request as any).user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'Authentication required for this operation',
      );
    }

    // Build user-specific identifier
    const identifier = `user:${userId}`;

    // Check rate limit
    const result = await this.rateLimitingService.checkLimit(
      identifier,
      config,
    );

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetIn);

    if (!result.allowed) {
      response.setHeader('Retry-After', result.resetIn);

      this.logger.warn(
        `User ${userId} exceeded rate limit: ${config.limit} requests per ${config.window}s (prefix: ${config.prefix})`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. You can make ${config.limit} requests per ${this.formatWindow(config.window)}. Please try again in ${result.resetIn} seconds.`,
          limit: result.limit,
          remaining: result.remaining,
          resetIn: result.resetIn,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.logger.debug(
      `User ${userId} rate limit check: ${result.current}/${result.limit} (${result.remaining} remaining)`,
    );

    return true;
  }

  private formatWindow(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds === 1 ? '' : 's'}`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days === 1 ? '' : 's'}`;
    }
  }
}
