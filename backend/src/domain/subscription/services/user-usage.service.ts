// ============================================================================
// USER USAGE SERVICE - User Subscription Domain
// ============================================================================
// Service for tracking and enforcing per-event feature usage limits

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSubscriptionRepository } from '../repositories/user-subscription.repository';
import { UserSubscriptionService } from './user-subscription.service';
import { EventCreditRepository } from '../repositories/event-credit.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { EventTier } from '@prisma/client';
import { EventTierFeature } from '@prisma/client';

export interface FeatureLimitStatus {
  featureKey: string;
  limit: number;
  used: number;
  remaining: number;
  isUnlimited: boolean;
}

export interface EventUsageSummary {
  eventId: string;
  features: FeatureLimitStatus[];
  totalFeaturesUsed: number;
}

@Injectable()
export class UserUsageService {
  private readonly logger = new Logger(UserUsageService.name);

  constructor(
    private readonly subscriptionRepository: UserSubscriptionRepository,
    private readonly subscriptionService: UserSubscriptionService,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventCreditRepository: EventCreditRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Record usage of a feature for an event
   * Usage is tracked PER EVENT, not per month
   */
  async recordUsage(
    userId: string,
    eventId: string,
    featureKey: string,
    quantity: number = 1,
  ) {
    this.logger.debug(
      `Recording usage: ${featureKey} for user ${userId} on event ${eventId}`,
    );

    // Get active subscription
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);
    if (!subscription) {
      throw new ForbiddenException('No active subscription found');
    }

    // Check if usage is allowed before recording
    const canUse = await this.canUseFeature(userId, eventId, featureKey);
    if (!canUse) {
      throw new ForbiddenException(
        `Feature limit reached for ${featureKey} on this event`,
      );
    }

    // Record the usage
    const usage = await this.subscriptionRepository.incrementUsage({
      subscriptionId: subscription.id,
      eventId,
      featureKey,
      incrementBy: quantity,
    });

    // Check limits after recording
    const limitStatus = await this.checkFeatureLimit(
      userId,
      eventId,
      featureKey,
    );

    if (!limitStatus.isUnlimited && limitStatus.remaining <= 0) {
      this.eventEmitter.emit('user-usage.limit-reached', {
        userId,
        eventId,
        featureKey,
        subscriptionId: subscription.id,
      });
    } else if (
      !limitStatus.isUnlimited &&
      limitStatus.remaining <= limitStatus.limit * 0.1
    ) {
      this.eventEmitter.emit('user-usage.limit-approaching', {
        userId,
        eventId,
        featureKey,
        remaining: limitStatus.remaining,
        limit: limitStatus.limit,
      });
    }

    return usage;
  }

  /**
   * Check if a feature can be used for an event (has remaining quota)
   * Usage limits are PER EVENT, not per month
   */
  async canUseFeature(
    userId: string,
    eventId: string,
    featureKey: string,
  ): Promise<boolean> {
    const status = await this.checkFeatureLimit(userId, eventId, featureKey);
    return status.isUnlimited || status.remaining > 0;
  }

  /**
   * Get current usage status for a feature on an event
   * Returns limit, used, remaining, and isUnlimited
   * Feature limits are based on the EVENT'S TIER, not subscription
   */
  async checkFeatureLimit(
    userId: string,
    eventId: string,
    featureKey: string,
  ): Promise<FeatureLimitStatus> {
    // Get the event to determine its tier
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { tier: true },
    });

    if (!event) {
      return {
        featureKey,
        limit: 0,
        used: 0,
        remaining: 0,
        isUnlimited: false,
      };
    }

    // Get feature limit from the event's tier
    const tierFeature = await this.eventCreditRepository.getTierFeature(
      event.tier,
      featureKey,
    );

    const isUnlimited = tierFeature?.limitType === 'UNLIMITED';
    const limit = isUnlimited ? -1 : (tierFeature?.limitValue ?? 0);

    // Get subscription for usage tracking (still needed for usage records)
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    // Get current usage for this event (per-event limits)
    const used = subscription
      ? await this.subscriptionRepository.getUsageForEvent(
          subscription.id,
          eventId,
          featureKey,
        )
      : 0;

    return {
      featureKey,
      limit: isUnlimited ? -1 : limit,
      used,
      remaining: isUnlimited ? -1 : Math.max(0, limit - used),
      isUnlimited,
    };
  }

  /**
   * Get all feature usage for an event
   * Features are based on the event's tier
   */
  async getEventUsage(
    userId: string,
    eventId: string,
  ): Promise<EventUsageSummary> {
    // Get the event to determine its tier
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { tier: true },
    });

    if (!event) {
      return {
        eventId,
        features: [],
        totalFeaturesUsed: 0,
      };
    }

    // Get all features for this event's tier
    const tierFeatures = await this.eventCreditRepository.getTierFeatures(event.tier);

    // Get usage for each feature on this event
    const features: FeatureLimitStatus[] = [];
    let totalFeaturesUsed = 0;

    for (const feature of tierFeatures) {
      const status = await this.checkFeatureLimit(
        userId,
        eventId,
        feature.featureKey,
      );
      features.push(status);
      if (status.used > 0) {
        totalFeaturesUsed++;
      }
    }

    return {
      eventId,
      features,
      totalFeaturesUsed,
    };
  }

  /**
   * Get usage history for a user, optionally filtered by event
   */
  async getUsageHistory(userId: string, eventId?: string) {
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      return [];
    }

    return this.subscriptionRepository.getUsageHistory(
      subscription.id,
      eventId,
    );
  }

  /**
   * Get all feature limits for an event based on its tier
   * Useful for displaying event limits
   */
  async getAllFeatureLimits(userId: string, eventId?: string) {
    // If eventId is provided, get features based on that event's tier
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { tier: true },
      });

      if (event) {
        const tierFeatures = await this.eventCreditRepository.getTierFeatures(event.tier);
        return tierFeatures.map((f) => ({
          featureKey: f.featureKey,
          featureName: f.featureName,
          description: f.description,
          limitType: f.limitType,
          limitValue: f.limitValue,
          isUnlimited: f.limitType === 'UNLIMITED',
        }));
      }
    }

    // Default to Basic tier features if no event specified
    const basicFeatures = await this.eventCreditRepository.getTierFeatures(EventTier.BASIC);
    return basicFeatures.map((f) => ({
      featureKey: f.featureKey,
      featureName: f.featureName,
      description: f.description,
      limitType: f.limitType,
      limitValue: f.limitValue,
      isUnlimited: f.limitType === 'UNLIMITED',
    }));
  }

  /**
   * Check multiple features at once for an event
   */
  async checkMultipleFeatures(
    userId: string,
    eventId: string,
    featureKeys: string[],
  ): Promise<Map<string, FeatureLimitStatus>> {
    const results = new Map<string, FeatureLimitStatus>();

    for (const featureKey of featureKeys) {
      const status = await this.checkFeatureLimit(userId, eventId, featureKey);
      results.set(featureKey, status);
    }

    return results;
  }

  /**
   * Bulk record usage (for batch operations)
   */
  async recordBulkUsage(
    userId: string,
    eventId: string,
    usages: Array<{ featureKey: string; quantity: number }>,
  ) {
    const results: any[] = [];

    for (const usage of usages) {
      const result = await this.recordUsage(
        userId,
        eventId,
        usage.featureKey,
        usage.quantity,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Get aggregate usage across all events for a feature
   */
  async getAggregateUsage(userId: string, featureKey: string): Promise<number> {
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      return 0;
    }

    return this.subscriptionRepository.getAggregateUsage(
      subscription.id,
      featureKey,
    );
  }

  /**
   * Reset usage for an event (admin function)
   */
  async resetEventUsage(eventId: string): Promise<void> {
    this.logger.log(`Resetting usage for event: ${eventId}`);
    await this.subscriptionRepository.deleteUsageForEvent(eventId);

    this.eventEmitter.emit('user-usage.event-reset', { eventId });
  }

  /**
   * Check if user has access to a boolean feature for an event
   * Access is based on the event's tier
   */
  async hasFeatureAccess(userId: string, featureKey: string, eventId?: string): Promise<boolean> {
    // Determine which tier to check
    let tier: EventTier = EventTier.BASIC;

    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { tier: true },
      });
      if (event) {
        tier = event.tier;
      }
    }

    // Get feature from the tier
    const feature = await this.eventCreditRepository.getTierFeature(tier, featureKey);

    if (!feature) {
      return false;
    }

    // For boolean features, check if limitValue is truthy
    if (feature.limitType === 'BOOLEAN') {
      return !!feature.limitValue;
    }

    // For count-based features, check if limit > 0 or unlimited
    return feature.limitType === 'UNLIMITED' || (feature.limitValue ?? 0) > 0;
  }

  /**
   * Get feature keys that are approaching limit for an event
   */
  async getApproachingLimits(
    userId: string,
    eventId: string,
    thresholdPercent: number = 80,
  ): Promise<FeatureLimitStatus[]> {
    const eventUsage = await this.getEventUsage(userId, eventId);

    return eventUsage.features.filter((f) => {
      if (f.isUnlimited || f.limit === 0) {
        return false;
      }
      const usedPercent = (f.used / f.limit) * 100;
      return usedPercent >= thresholdPercent;
    });
  }

  /**
   * Check storage limit for an event
   * Returns whether adding fileSizeBytes would exceed the limit
   * Storage limits are based on the event's tier
   */
  async checkStorageLimit(
    userId: string,
    eventId: string,
    fileSizeBytes: number,
  ): Promise<{
    allowed: boolean;
    currentUsageMB: number;
    limitMB: number;
    remainingMB: number;
    isUnlimited: boolean;
    fileSizeMB: number;
  }> {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    // Get the event to determine its tier
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { tier: true },
    });

    if (!event) {
      return {
        allowed: false,
        currentUsageMB: 0,
        limitMB: 0,
        remainingMB: 0,
        isUnlimited: false,
        fileSizeMB,
      };
    }

    // Get storage limit from event's tier
    const storageFeature = await this.eventCreditRepository.getTierFeature(
      event.tier,
      'memory_storage_mb',
    );

    const isUnlimited = storageFeature?.limitType === 'UNLIMITED';
    const limitMB = isUnlimited ? -1 : (storageFeature?.limitValue ?? 0);

    // Get subscription for usage tracking
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    // Get current storage usage for this event
    const currentUsageMB = subscription
      ? await this.subscriptionRepository.getUsageForEvent(
          subscription.id,
          eventId,
          'memory_storage_mb',
        )
      : 0;

    if (isUnlimited) {
      return {
        allowed: true,
        currentUsageMB,
        limitMB: -1,
        remainingMB: -1,
        isUnlimited: true,
        fileSizeMB,
      };
    }

    const remainingMB = Math.max(0, limitMB - currentUsageMB);
    const allowed = currentUsageMB + fileSizeMB <= limitMB;

    return {
      allowed,
      currentUsageMB,
      limitMB,
      remainingMB,
      isUnlimited: false,
      fileSizeMB,
    };
  }

  /**
   * Record storage usage for an event (in MB)
   */
  async recordStorageUsage(
    userId: string,
    eventId: string,
    fileSizeBytes: number,
  ): Promise<void> {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    this.logger.debug(
      `Recording storage usage: ${fileSizeMB.toFixed(2)}MB for user ${userId} on event ${eventId}`,
    );

    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      this.logger.warn(`No active subscription for user ${userId} - skipping storage recording`);
      return;
    }

    // Record the storage usage (accumulative)
    await this.subscriptionRepository.incrementUsage({
      subscriptionId: subscription.id,
      eventId,
      featureKey: 'memory_storage_mb',
      incrementBy: fileSizeMB,
    });

    // Check if approaching limit
    const storageStatus = await this.checkStorageLimit(userId, eventId, 0);

    if (!storageStatus.isUnlimited) {
      const usedPercent = (storageStatus.currentUsageMB / storageStatus.limitMB) * 100;

      if (usedPercent >= 100) {
        this.eventEmitter.emit('user-usage.storage-limit-reached', {
          userId,
          eventId,
          currentUsageMB: storageStatus.currentUsageMB,
          limitMB: storageStatus.limitMB,
        });
      } else if (usedPercent >= 80) {
        this.eventEmitter.emit('user-usage.storage-limit-approaching', {
          userId,
          eventId,
          currentUsageMB: storageStatus.currentUsageMB,
          limitMB: storageStatus.limitMB,
          remainingMB: storageStatus.remainingMB,
          usedPercent: Math.round(usedPercent),
        });
      }
    }
  }

  /**
   * Get storage usage summary for an event
   */
  async getStorageUsageSummary(
    userId: string,
    eventId: string,
  ): Promise<{
    currentUsageMB: number;
    limitMB: number;
    remainingMB: number;
    usedPercent: number;
    isUnlimited: boolean;
  }> {
    const storageStatus = await this.checkStorageLimit(userId, eventId, 0);

    const usedPercent = storageStatus.isUnlimited
      ? 0
      : storageStatus.limitMB > 0
        ? Math.round((storageStatus.currentUsageMB / storageStatus.limitMB) * 100)
        : 0;

    return {
      currentUsageMB: Math.round(storageStatus.currentUsageMB * 100) / 100,
      limitMB: storageStatus.limitMB,
      remainingMB: Math.round(storageStatus.remainingMB * 100) / 100,
      usedPercent,
      isUnlimited: storageStatus.isUnlimited,
    };
  }
}
