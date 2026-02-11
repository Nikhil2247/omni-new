// ============================================================================
// CACHE INVALIDATION HANDLER - Event-Driven Cache Management
// ============================================================================
// Handles cache invalidation based on domain events
// Comprehensive coverage for all domain entities
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
  VENDOR_EVENTS,
  CATEGORY_EVENTS,
  SERVICE_EVENTS,
  CACHE_EVENTS,
  USER_EVENTS,
  LEAD_EVENTS,
  EVENT_EVENTS,
  PORTFOLIO_EVENTS,
  REVIEW_EVENTS,
  KYC_EVENTS,
  CacheInvalidationPayload,
} from '../event-constants'
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service'

@Injectable()
export class CacheInvalidationHandler {
  private readonly logger = new Logger(CacheInvalidationHandler.name)

  constructor(private readonly cache: DragonflyService) {}

  // ============================================================================
  // VENDOR CACHE INVALIDATION
  // ============================================================================

  @OnEvent(VENDOR_EVENTS.CREATED)
  @OnEvent(VENDOR_EVENTS.UPDATED)
  @OnEvent(VENDOR_EVENTS.DELETED)
  @OnEvent(VENDOR_EVENTS.PUBLISHED)
  @OnEvent(VENDOR_EVENTS.UNPUBLISHED)
  @OnEvent(VENDOR_EVENTS.VERIFIED)
  @OnEvent(VENDOR_EVENTS.SUSPENDED)
  @OnEvent(VENDOR_EVENTS.REACTIVATED)
  @OnEvent(VENDOR_EVENTS.FEATURED)
  @OnEvent(VENDOR_EVENTS.UNFEATURED)
  async handleVendorChange(payload: { vendorProfileId: string; categoryId?: string }) {
    this.logger.debug(`Invalidating cache for vendor: ${payload.vendorProfileId}`)

    await this.invalidateKeys([
      `vendor:${payload.vendorProfileId}`,
      `vendor:${payload.vendorProfileId}:profile`,
      `vendor:${payload.vendorProfileId}:services`,
      `vendor:${payload.vendorProfileId}:portfolio`,
      `vendor:${payload.vendorProfileId}:reviews`,
      `vendor:${payload.vendorProfileId}:stats`,
    ])

    // Invalidate list and discovery caches
    await this.invalidatePattern('vendors:list:*')
    await this.invalidatePattern('discovery:*')
    await this.invalidatePattern('search:vendors:*')

    // If category is known, invalidate category-specific caches
    if (payload.categoryId) {
      await this.invalidatePattern(`category:${payload.categoryId}:vendors:*`)
    }
  }

  // ============================================================================
  // CATEGORY CACHE INVALIDATION
  // ============================================================================

  @OnEvent(CATEGORY_EVENTS.CREATED)
  @OnEvent(CATEGORY_EVENTS.UPDATED)
  @OnEvent(CATEGORY_EVENTS.DELETED)
  async handleCategoryChange(payload: { categoryId: string }) {
    this.logger.debug(`Invalidating cache for category: ${payload.categoryId}`)

    await this.invalidateKeys([
      `category:${payload.categoryId}`,
      `category:${payload.categoryId}:vendors`,
      `category:${payload.categoryId}:services`,
      'categories:all',
      'categories:tree',
      'categories:active',
    ])

    // Invalidate vendor lists that might be filtered by category
    await this.invalidatePattern('vendors:list:*')
    await this.invalidatePattern('discovery:*')
  }

  // ============================================================================
  // SERVICE CACHE INVALIDATION
  // ============================================================================

  @OnEvent(SERVICE_EVENTS.CREATED)
  @OnEvent(SERVICE_EVENTS.UPDATED)
  @OnEvent(SERVICE_EVENTS.DELETED)
  async handleServiceChange(payload: { serviceId: string; vendorProfileId: string }) {
    this.logger.debug(`Invalidating cache for service: ${payload.serviceId}`)

    await this.invalidateKeys([
      `service:${payload.serviceId}`,
      `vendor:${payload.vendorProfileId}:services`,
    ])

    // Invalidate search caches
    await this.invalidatePattern('search:services:*')
  }

  // ============================================================================
  // USER CACHE INVALIDATION
  // ============================================================================

  @OnEvent(USER_EVENTS.UPDATED)
  @OnEvent(USER_EVENTS.ROLE_ASSIGNED)
  @OnEvent(USER_EVENTS.ROLE_REMOVED)
  async handleUserChange(payload: { userId: string }) {
    this.logger.debug(`Invalidating cache for user: ${payload.userId}`)

    await this.invalidateKeys([
      `user:${payload.userId}`,
      `user:${payload.userId}:profile`,
      `user:${payload.userId}:roles`,
      `user:${payload.userId}:permissions`,
      `user:${payload.userId}:sessions`,
    ])
  }

  @OnEvent(USER_EVENTS.LOGGED_OUT)
  @OnEvent(USER_EVENTS.LOGGED_OUT_ALL_DEVICES)
  async handleUserLogout(payload: { userId: string }) {
    this.logger.debug(`Invalidating session cache for user: ${payload.userId}`)

    await this.invalidatePattern(`session:${payload.userId}:*`)
    await this.invalidateKeys([`user:${payload.userId}:sessions`])
  }

  // ============================================================================
  // LEAD CACHE INVALIDATION
  // ============================================================================

  @OnEvent(LEAD_EVENTS.CREATED)
  @OnEvent(LEAD_EVENTS.UPDATED)
  @OnEvent(LEAD_EVENTS.STATUS_CHANGED)
  @OnEvent(LEAD_EVENTS.CONVERTED)
  @OnEvent(LEAD_EVENTS.LOST)
  async handleLeadChange(payload: { leadId: string; vendorProfileId: string; plannerId?: string }) {
    this.logger.debug(`Invalidating cache for lead: ${payload.leadId}`)

    await this.invalidateKeys([
      `lead:${payload.leadId}`,
      `vendor:${payload.vendorProfileId}:leads`,
      `vendor:${payload.vendorProfileId}:leads:stats`,
      `vendor:${payload.vendorProfileId}:leads:unread`,
    ])

    if (payload.plannerId) {
      await this.invalidateKeys([
        `user:${payload.plannerId}:leads`,
      ])
    }
  }

  @OnEvent(LEAD_EVENTS.MESSAGE_SENT)
  @OnEvent(LEAD_EVENTS.MESSAGE_READ)
  async handleLeadMessage(payload: { leadId: string; vendorProfileId: string }) {
    await this.invalidateKeys([
      `lead:${payload.leadId}:messages`,
      `vendor:${payload.vendorProfileId}:leads:unread`,
    ])
  }

  // ============================================================================
  // EVENT CACHE INVALIDATION
  // ============================================================================

  @OnEvent(EVENT_EVENTS.CREATED)
  @OnEvent(EVENT_EVENTS.UPDATED)
  @OnEvent(EVENT_EVENTS.DELETED)
  @OnEvent(EVENT_EVENTS.STATUS_CHANGED)
  async handleEventChange(payload: { eventId: string; userId: string }) {
    this.logger.debug(`Invalidating cache for event: ${payload.eventId}`)

    await this.invalidateKeys([
      `event:${payload.eventId}`,
      `event:${payload.eventId}:details`,
      `event:${payload.eventId}:vendors`,
      `event:${payload.eventId}:checklist`,
      `event:${payload.eventId}:budget`,
      `event:${payload.eventId}:timeline`,
      `user:${payload.userId}:events`,
    ])
  }

  @OnEvent(EVENT_EVENTS.VENDOR_ADDED)
  @OnEvent(EVENT_EVENTS.VENDOR_REMOVED)
  async handleEventVendorChange(payload: { eventId: string; vendorProfileId: string }) {
    await this.invalidateKeys([
      `event:${payload.eventId}:vendors`,
      `vendor:${payload.vendorProfileId}:events`,
    ])
  }

  @OnEvent(EVENT_EVENTS.TASK_CREATED)
  @OnEvent(EVENT_EVENTS.TASK_COMPLETED)
  async handleEventTask(payload: { eventId: string }) {
    await this.invalidateKeys([
      `event:${payload.eventId}:checklist`,
      `event:${payload.eventId}:tasks:stats`,
    ])
  }

  // ============================================================================
  // PORTFOLIO CACHE INVALIDATION
  // ============================================================================

  @OnEvent(PORTFOLIO_EVENTS.CREATED)
  @OnEvent(PORTFOLIO_EVENTS.UPDATED)
  @OnEvent(PORTFOLIO_EVENTS.DELETED)
  async handlePortfolioChange(payload: { portfolioId: string; vendorProfileId: string }) {
    this.logger.debug(`Invalidating cache for portfolio: ${payload.portfolioId}`)

    await this.invalidateKeys([
      `portfolio:${payload.portfolioId}`,
      `vendor:${payload.vendorProfileId}:portfolio`,
      `vendor:${payload.vendorProfileId}:portfolio:featured`,
    ])
  }

  // ============================================================================
  // REVIEW CACHE INVALIDATION
  // ============================================================================

  @OnEvent(REVIEW_EVENTS.CREATED)
  @OnEvent(REVIEW_EVENTS.UPDATED)
  @OnEvent(REVIEW_EVENTS.DELETED)
  @OnEvent(REVIEW_EVENTS.APPROVED)
  async handleReviewChange(payload: { reviewId: string; vendorProfileId: string }) {
    this.logger.debug(`Invalidating cache for review: ${payload.reviewId}`)

    await this.invalidateKeys([
      `review:${payload.reviewId}`,
      `vendor:${payload.vendorProfileId}:reviews`,
      `vendor:${payload.vendorProfileId}:reviews:stats`,
      `vendor:${payload.vendorProfileId}:rating`,
    ])
  }

  // ============================================================================
  // KYC CACHE INVALIDATION
  // ============================================================================

  @OnEvent(KYC_EVENTS.SUBMITTED)
  @OnEvent(KYC_EVENTS.APPROVED)
  @OnEvent(KYC_EVENTS.REJECTED)
  async handleKYCChange(payload: { vendorProfileId: string }) {
    this.logger.debug(`Invalidating KYC cache for vendor: ${payload.vendorProfileId}`)

    await this.invalidateKeys([
      `vendor:${payload.vendorProfileId}:kyc`,
      `vendor:${payload.vendorProfileId}:verification`,
    ])
  }

  // ============================================================================
  // GENERIC CACHE INVALIDATION
  // ============================================================================

  @OnEvent(CACHE_EVENTS.INVALIDATE)
  async handleCacheInvalidate(payload: CacheInvalidationPayload) {
    if (payload.keys) {
      await this.invalidateKeys(payload.keys)
    }

    if (payload.entityType && payload.entityId) {
      await this.invalidateKeys([`${payload.entityType}:${payload.entityId}`])
      await this.invalidatePattern(`${payload.entityType}:${payload.entityId}:*`)
    }
  }

  @OnEvent(CACHE_EVENTS.INVALIDATE_PATTERN)
  async handleCacheInvalidatePattern(payload: CacheInvalidationPayload) {
    if (payload.pattern) {
      await this.invalidatePattern(payload.pattern)
    }
  }

  @OnEvent(CACHE_EVENTS.WARM_UP)
  async handleCacheWarmUp(payload: { entityType: string; entityIds?: string[] }) {
    this.logger.log(`Cache warm-up requested for: ${payload.entityType}`)
    // Emit event for warm-up processors to handle
    // This allows domain-specific warm-up logic
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async invalidateKeys(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        const pipeline = this.cache.getClient().pipeline()
        for (const key of keys) {
          pipeline.del(this.buildFullKey(key))
        }
        await pipeline.exec()
        this.logger.debug(`Invalidated cache keys: ${keys.join(', ')}`)
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate cache keys: ${error}`)
    }
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      const deleted = await this.cache.deletePattern(pattern)
      if (deleted > 0) {
        this.logger.debug(`Invalidated ${deleted} keys matching pattern: ${pattern}`)
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate pattern ${pattern}: ${error}`)
    }
  }

  private buildFullKey(key: string): string {
    // The cache service already adds prefix, so just return the key
    return key
  }
}
