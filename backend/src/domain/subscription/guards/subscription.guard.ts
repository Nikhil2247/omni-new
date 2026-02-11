// ============================================================================
// SUBSCRIPTION GUARD - Feature Access Control
// ============================================================================

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UsageService } from '../services/usage.service'
import { FeatureLimitType } from '../dto/subscription-plan.dto'
import { REQUIRED_FEATURE_KEY, REQUIRED_PLAN_KEY } from '../decorators/subscription.decorators'

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<FeatureLimitType>(
      REQUIRED_FEATURE_KEY,
      context.getHandler(),
    )

    const requiredPlan = this.reflector.get<string[]>(
      REQUIRED_PLAN_KEY,
      context.getHandler(),
    )

    if (!requiredFeature && !requiredPlan) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const vendorProfileId = request.user?.vendorProfileId || request.params?.vendorProfileId

    if (!vendorProfileId) {
      throw new ForbiddenException('Vendor profile ID required')
    }

    // Check feature limit
    if (requiredFeature) {
      const canUse = await this.usageService.canUseFeature(vendorProfileId, requiredFeature)
      if (!canUse) {
        throw new ForbiddenException(`Feature limit exceeded: ${requiredFeature}. Please upgrade your plan.`)
      }
    }

    // Check plan tier
    if (requiredPlan) {
      // TODO: Implement plan tier check
      // const subscription = await this.subscriptionService.findActiveByVendorProfile(vendorProfileId)
      // if (!subscription || !requiredPlan.includes(subscription.plan.tier)) {
      //   throw new ForbiddenException(`This feature requires a ${requiredPlan.join(' or ')} plan`)
      // }
    }

    return true
  }
}

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(private readonly usageService: UsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const vendorProfileId = request.user?.vendorProfileId || request.params?.vendorProfileId

    if (!vendorProfileId) {
      return true // Allow if not a vendor request
    }

    try {
      // Check if vendor has any feature access (indicates active subscription)
      await this.usageService.getAllFeatureLimits(vendorProfileId)
      return true
    } catch {
      throw new ForbiddenException('Active subscription required')
    }
  }
}
