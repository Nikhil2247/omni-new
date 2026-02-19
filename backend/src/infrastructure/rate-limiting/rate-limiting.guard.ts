// ============================================================================
// RATE LIMITING GUARD - Request-Level Rate Limit Enforcement
// ============================================================================
// Guards routes with distributed rate limiting using Redis
// ============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitingService, RateLimitConfig } from './rate-limiting.service';
import { RATE_LIMIT_KEY, SKIP_RATE_LIMIT_KEY } from './rate-limiting.decorator';

@Injectable()
export class RateLimitingGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitingGuard.name);

  constructor(
    private readonly rateLimitingService: RateLimitingService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting should be skipped
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    // Get rate limit config from decorator or use defaults
    const config =
      this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || this.getDefaultConfig(context);

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Build identifier (user ID, IP, or API key)
    const identifier = this.buildIdentifier(request);

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
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.resetIn,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private buildIdentifier(request: Request): string {
    // Priority: User ID > API Key > IP Address
    const userId = (request as any).user?.id;
    if (userId) {
      return `user:${userId}`;
    }

    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      return `apikey:${apiKey.slice(0, 16)}`; // Use first 16 chars of API key
    }

    // Fall back to IP address
    const ip =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  }

  private getDefaultConfig(context: ExecutionContext): RateLimitConfig {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path || '';

    // Gateway-based defaults
    if (path.includes('/admin')) {
      return { limit: 1000, window: 60, prefix: 'rl:admin' };
    }
    if (path.includes('/ops')) {
      return { limit: 500, window: 60, prefix: 'rl:ops' };
    }
    if (path.includes('/marketing') || path.includes('/sales')) {
      return { limit: 300, window: 60, prefix: 'rl:internal' };
    }
    if (path.includes('/business')) {
      return { limit: 200, window: 60, prefix: 'rl:business' };
    }
    if (path.includes('/user')) {
      return { limit: 100, window: 60, prefix: 'rl:user' };
    }
    if (path.includes('/public')) {
      return { limit: 50, window: 60, prefix: 'rl:public' };
    }

    // Default fallback
    return { limit: 100, window: 60, prefix: 'rl:default' };
  }
}
