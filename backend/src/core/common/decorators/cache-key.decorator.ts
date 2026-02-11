// ============================================================================
// CACHE KEY DECORATOR - Response Caching Metadata
// ============================================================================
// Decorators for configuring response caching
// ============================================================================

import { SetMetadata } from '@nestjs/common'

export const CACHE_KEY_METADATA = 'cacheKey'
export const CACHE_TTL_METADATA = 'cacheTtl'

/**
 * Mark a route for caching with a specific cache key
 * @param key - The base cache key for this route
 * @param ttl - Time to live in seconds (default: 60)
 */
export function CacheKey(key: string, ttl: number = 60) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey!, descriptor!)
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey!, descriptor!)
  }
}

/**
 * Set cache TTL separately from cache key
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl)

// Pre-configured cache decorators for common scenarios
export const CacheShort = (key: string) => CacheKey(key, 30) // 30 seconds
export const CacheMedium = (key: string) => CacheKey(key, 300) // 5 minutes
export const CacheLong = (key: string) => CacheKey(key, 900) // 15 minutes
export const CacheDay = (key: string) => CacheKey(key, 86400) // 24 hours

// Skip caching decorator
export const NO_CACHE_KEY = 'noCache'
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true)
