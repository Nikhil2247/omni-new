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
   */
  async checkFeatureLimit(
    userId: string,
    eventId: string,
    featureKey: string,
  ): Promise<FeatureLimitStatus> {
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      return {
        featureKey,
        limit: 0,
        used: 0,
        remaining: 0,
        isUnlimited: false,
      };
    }

    // Get feature limit from plan
    const subscriptionWithPlan = subscription as any;
    const featureLimit = subscriptionWithPlan.plan?.features?.find(
      (f: any) => f.featureKey === featureKey,
    );

    const isUnlimited = featureLimit?.limitType === 'UNLIMITED';
    const limit = isUnlimited ? -1 : (featureLimit?.limitValue ?? 0);

    // Get current usage for this event (per-event limits)
    const used = await this.subscriptionRepository.getUsageForEvent(
      subscription.id,
      eventId,
      featureKey,
    );

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
   */
  async getEventUsage(
    userId: string,
    eventId: string,
  ): Promise<EventUsageSummary> {
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      return {
        eventId,
        features: [],
        totalFeaturesUsed: 0,
      };
    }

    // Get all features from plan
    const subscriptionWithPlan = subscription as any;
    const planFeatures = subscriptionWithPlan.plan?.features || [];

    // Get usage for each feature on this event
    const features: FeatureLimitStatus[] = [];
    let totalFeaturesUsed = 0;

    for (const feature of planFeatures) {
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
   * Get all feature limits for a user (without event context)
   * Useful for displaying plan limits
   */
  async getAllFeatureLimits(userId: string) {
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      return [];
    }

    const subscriptionWithPlan = subscription as any;
    const features = subscriptionWithPlan.plan?.features || [];

    return features.map((f: any) => ({
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
   * Check if user has access to a boolean feature
   */
  async hasFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
    const subscription =
      await this.subscriptionService.findActiveByUserId(userId);

    if (!subscription) {
      return false;
    }

    const subscriptionWithPlan = subscription as any;
    const feature = subscriptionWithPlan.plan?.features?.find(
      (f: any) => f.featureKey === featureKey,
    );

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
}
