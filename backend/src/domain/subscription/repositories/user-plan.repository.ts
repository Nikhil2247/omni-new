// ============================================================================
// USER PLAN REPOSITORY - User Subscription Domain
// ============================================================================
// Repository for managing user subscription plans (FREE, BASIC, PREMIUM)

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, UserSubscriptionPlan, UserPlanTier } from '@prisma/client';

@Injectable()
export class UserPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user subscription plan
   */
  async create(
    data: Prisma.UserSubscriptionPlanCreateInput,
  ): Promise<UserSubscriptionPlan> {
    return this.prisma.userSubscriptionPlan.create({
      data,
      include: {
        features: true,
        prices: true,
      },
    });
  }

  /**
   * Find all plans with optional inactive filter
   */
  async findAll(includeInactive = false): Promise<UserSubscriptionPlan[]> {
    return this.prisma.userSubscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        prices: {
          where: { isActive: true },
          orderBy: { billingCycle: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Find plan by ID with relations
   */
  async findById(
    id: string,
    include?: Prisma.UserSubscriptionPlanInclude,
  ): Promise<UserSubscriptionPlan | null> {
    return this.prisma.userSubscriptionPlan.findUnique({
      where: { id },
      include: include ?? {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        prices: {
          where: { isActive: true },
          orderBy: { billingCycle: 'asc' },
        },
      },
    });
  }

  /**
   * Find plan by slug
   */
  async findBySlug(slug: string): Promise<UserSubscriptionPlan | null> {
    return this.prisma.userSubscriptionPlan.findUnique({
      where: { slug },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        prices: {
          where: { isActive: true },
          orderBy: { billingCycle: 'asc' },
        },
      },
    });
  }

  /**
   * Find plan by tier (FREE, BASIC, PREMIUM)
   */
  async findByTier(tier: UserPlanTier): Promise<UserSubscriptionPlan | null> {
    return this.prisma.userSubscriptionPlan.findFirst({
      where: { tier, isActive: true },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        prices: {
          where: { isActive: true },
          orderBy: { billingCycle: 'asc' },
        },
      },
    });
  }

  /**
   * Find all public and active plans (for display)
   */
  async findPublicPlans(): Promise<UserSubscriptionPlan[]> {
    return this.prisma.userSubscriptionPlan.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        prices: {
          where: { isActive: true },
          orderBy: { billingCycle: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Update a plan
   */
  async update(
    id: string,
    data: Prisma.UserSubscriptionPlanUpdateInput,
  ): Promise<UserSubscriptionPlan> {
    return this.prisma.userSubscriptionPlan.update({
      where: { id },
      data,
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        prices: {
          where: { isActive: true },
          orderBy: { billingCycle: 'asc' },
        },
      },
    });
  }

  /**
   * Delete a plan (soft delete by setting isActive = false)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.userSubscriptionPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Add a feature to a plan
   */
  async addFeature(
    planId: string,
    data: Omit<Prisma.UserPlanFeatureCreateInput, 'plan'>,
  ) {
    return this.prisma.userPlanFeature.create({
      data: {
        ...data,
        plan: { connect: { id: planId } },
      },
    });
  }

  /**
   * Update a feature
   */
  async updateFeature(
    featureId: string,
    data: Prisma.UserPlanFeatureUpdateInput,
  ) {
    return this.prisma.userPlanFeature.update({
      where: { id: featureId },
      data,
    });
  }

  /**
   * Delete a feature
   */
  async deleteFeature(featureId: string): Promise<void> {
    await this.prisma.userPlanFeature.delete({
      where: { id: featureId },
    });
  }

  /**
   * Add a price to a plan
   */
  async addPrice(
    planId: string,
    data: Omit<Prisma.UserPlanPriceCreateInput, 'plan'>,
  ) {
    return this.prisma.userPlanPrice.create({
      data: {
        ...data,
        plan: { connect: { id: planId } },
      },
    });
  }

  /**
   * Update a price
   */
  async updatePrice(priceId: string, data: Prisma.UserPlanPriceUpdateInput) {
    return this.prisma.userPlanPrice.update({
      where: { id: priceId },
      data,
    });
  }

  /**
   * Get the FREE tier plan
   */
  async getFreePlan(): Promise<UserSubscriptionPlan | null> {
    return this.findByTier('FREE' as UserPlanTier);
  }
}
