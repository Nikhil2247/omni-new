// ============================================================================
// USAGE SERVICE - Subscription Domain
// ============================================================================
// Tracks feature usage and enforces limits

import { Injectable, ForbiddenException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UsageRepository } from '../repositories/usage.repository'
import { SubscriptionService } from './subscription.service'
import { FeatureLimitType } from '../dto/subscription-plan.dto'

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name)

  constructor(
    private readonly usageRepository: UsageRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Record usage of a feature
   */
  async recordUsage(vendorProfileId: string, featureKey: string, quantity: number = 1) {
    this.logger.debug(`Recording usage: ${featureKey} for vendor ${vendorProfileId}`)

    // Get active subscription
    const subscription = await this.subscriptionService.findActiveByVendorProfile(vendorProfileId)
    if (!subscription) {
      throw new ForbiddenException('No active subscription found')
    }

    // Record the usage
    const usage = await this.usageRepository.incrementUsage({
      subscriptionId: subscription.id,
      featureKey,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      incrementBy: quantity,
    })

    // Check if approaching limit
    const limitStatus = await this.checkFeatureLimit(vendorProfileId, featureKey)
    if (limitStatus.remaining <= 0) {
      this.eventEmitter.emit('usage.limit-reached', {
        vendorProfileId,
        featureKey,
        subscriptionId: subscription.id,
      })
    } else if (limitStatus.remaining <= limitStatus.limit * 0.1) {
      this.eventEmitter.emit('usage.limit-approaching', {
        vendorProfileId,
        featureKey,
        remaining: limitStatus.remaining,
        limit: limitStatus.limit,
      })
    }

    return usage
  }

  /**
   * Check if a feature can be used (has remaining quota)
   */
  async canUseFeature(vendorProfileId: string, featureKey: string): Promise<boolean> {
    const status = await this.checkFeatureLimit(vendorProfileId, featureKey)
    return status.isUnlimited || status.remaining > 0
  }

  /**
   * Get current usage status for a feature
   */
  async checkFeatureLimit(vendorProfileId: string, featureKey: string) {
    const subscription = await this.subscriptionService.findActiveByVendorProfile(vendorProfileId)
    if (!subscription) {
      return {
        featureKey,
        limit: 0,
        used: 0,
        remaining: 0,
        isUnlimited: false,
      }
    }

    // Get feature limit from plan
    const featureLimit = (subscription as any).plan?.features?.find(
      (f: any) => f.featureKey === featureKey,
    )

    const isUnlimited = featureLimit?.limitType === FeatureLimitType.UNLIMITED
    const limit = isUnlimited ? -1 : (featureLimit?.limitValue ?? 0)

    // Get current period usage
    const used = await this.usageRepository.getUsageForPeriod(
      subscription.id,
      featureKey,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
    )

    return {
      featureKey,
      limit: isUnlimited ? -1 : limit,
      used,
      remaining: isUnlimited ? -1 : Math.max(0, limit - used),
      isUnlimited,
    }
  }

  /**
   * Get all feature limits and usage for a vendor
   */
  async getAllFeatureLimits(vendorProfileId: string) {
    const subscription = await this.subscriptionService.findActiveByVendorProfile(vendorProfileId)
    if (!subscription) {
      return []
    }

    const featureLimits = (subscription as any).plan?.features || []
    const results: Array<{
      featureKey: string
      limit: number
      used: number
      remaining: number
      isUnlimited: boolean
      description?: string
    }> = []

    for (const feature of featureLimits) {
      const status = await this.checkFeatureLimit(vendorProfileId, feature.featureKey)
      results.push({
        ...status,
        description: feature.description,
      })
    }

    return results
  }

  /**
   * Get usage history for a subscription
   */
  async getUsageHistory(subscriptionId: string, featureKey?: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.usageRepository.getUsageHistory(subscriptionId, featureKey, startDate)
  }

  /**
   * Reset usage for a new billing period
   */
  async resetPeriodUsage(subscriptionId: string) {
    this.logger.log(`Resetting usage for subscription: ${subscriptionId}`)
    // Usage records are kept for history, but the period filter handles the reset
    this.eventEmitter.emit('usage.period-reset', { subscriptionId })
  }
}
