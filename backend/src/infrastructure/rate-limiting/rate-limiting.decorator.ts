// ============================================================================
// RATE LIMITING DECORATORS - Configure Rate Limits on Endpoints
// ============================================================================

import { SetMetadata } from '@nestjs/common'
import { RateLimitConfig } from './rate-limiting.service'

export const RATE_LIMIT_KEY = 'rateLimit'
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit'

/**
 * Configure custom rate limit for an endpoint or controller
 *
 * @example
 * ```typescript
 * @RateLimit({ limit: 10, window: 60 }) // 10 requests per minute
 * @Post('expensive-operation')
 * async expensiveOperation() { ... }
 * ```
 */
export const RateLimit = (config: RateLimitConfig): MethodDecorator & ClassDecorator => {
  return SetMetadata(RATE_LIMIT_KEY, config)
}

/**
 * Skip rate limiting for an endpoint
 *
 * @example
 * ```typescript
 * @SkipRateLimit()
 * @Get('health')
 * async health() { ... }
 * ```
 */
export const SkipRateLimit = (): MethodDecorator & ClassDecorator => {
  return SetMetadata(SKIP_RATE_LIMIT_KEY, true)
}

/**
 * Apply strict rate limit (low limit, short window)
 * Useful for authentication endpoints
 */
export const StrictRateLimit = (): MethodDecorator => {
  return RateLimit({ limit: 5, window: 60, prefix: 'rl:strict' })
}

/**
 * Apply relaxed rate limit (high limit, longer window)
 * Useful for read-heavy endpoints
 */
export const RelaxedRateLimit = (): MethodDecorator => {
  return RateLimit({ limit: 500, window: 60, prefix: 'rl:relaxed' })
}
