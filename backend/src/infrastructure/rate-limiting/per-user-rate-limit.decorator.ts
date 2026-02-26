// ============================================================================
// PER-USER RATE LIMIT DECORATOR - User-Based Rate Limiting
// ============================================================================
// Enforces rate limits on a per-authenticated-user basis
// Falls back to IP-based limiting for unauthenticated requests
// ============================================================================

import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from './rate-limiting.service';

export const PER_USER_RATE_LIMIT_KEY = 'per_user_rate_limit';

/**
 * Per-user rate limit decorator
 * Applies rate limiting based on authenticated user ID
 *
 * @example
 * // Limit to 10 requests per minute per user
 * @PerUserRateLimit({ limit: 10, window: 60 })
 * async createLead() { ... }
 *
 * @example
 * // Limit lead creation to 5 per hour per user
 * @PerUserRateLimit({ limit: 5, window: 3600, prefix: 'lead:create' })
 * async createLead() { ... }
 */
export const PerUserRateLimit = (config: RateLimitConfig) =>
  SetMetadata(PER_USER_RATE_LIMIT_KEY, {
    ...config,
    prefix: config.prefix || 'rl:user',
  });

/**
 * Predefined per-user rate limits for common operations
 */
export const PerUserRateLimits = {
  /**
   * For expensive operations like lead creation
   * 10 per hour = prevents spam while allowing legitimate use
   */
  LEAD_CREATION: { limit: 10, window: 3600, prefix: 'rl:user:lead' },

  /**
   * For message sending
   * 30 per minute = allows conversation while preventing spam
   */
  MESSAGE_SEND: { limit: 30, window: 60, prefix: 'rl:user:message' },

  /**
   * For event creation
   * 5 per hour = prevents abuse
   */
  EVENT_CREATION: { limit: 5, window: 3600, prefix: 'rl:user:event' },

  /**
   * For file uploads
   * 20 per hour = prevents storage abuse
   */
  FILE_UPLOAD: { limit: 20, window: 3600, prefix: 'rl:user:upload' },

  /**
   * For review posting
   * 3 per day = prevents fake reviews
   */
  REVIEW_POST: { limit: 3, window: 86400, prefix: 'rl:user:review' },

  /**
   * For search queries
   * 60 per minute = prevents scraping
   */
  SEARCH: { limit: 60, window: 60, prefix: 'rl:user:search' },

  /**
   * For API calls (general)
   * 100 per minute = standard tier
   */
  API_STANDARD: { limit: 100, window: 60, prefix: 'rl:user:api' },

  /**
   * For API calls (premium)
   * 500 per minute = premium tier
   */
  API_PREMIUM: { limit: 500, window: 60, prefix: 'rl:user:api:premium' },
};
