// ============================================================================
// SUBSCRIPTION PLAN SERVICE - Subscription Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository'
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto, PlanTier } from '../dto/subscription-plan.dto'

@Injectable()
export class SubscriptionPlanService {
  private readonly logger = new Logger(SubscriptionPlanService.name)

  constructor(
    private readonly planRepository: SubscriptionPlanRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateSubscriptionPlanDto) {
    this.logger.log(`Creating subscription plan: ${dto.name}`)

    // Generate slug from name
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const plan = await this.planRepository.create({
      name: dto.name,
      slug,
      tier: dto.tier,
      description: dto.description,
      displayOrder: dto.displayOrder ?? 0,
      isPopular: dto.isPopular ?? false,
      trialDays: dto.trialDays ?? 0,
      isActive: dto.isActive ?? true,
      isPublic: dto.isPublic ?? true,
      features: {
        create: dto.features.map(f => ({
          featureKey: f.featureKey,
          featureName: f.featureName,
          description: f.description,
          limitType: f.limitType,
          limitValue: f.limitValue,
          isHighlighted: f.isHighlighted ?? false,
          sortOrder: f.sortOrder ?? 0,
        })),
      },
      prices: {
        create: dto.prices.map(p => ({
          billingCycle: p.billingCycle,
          amount: p.amount,
          currency: p.currency,
          stripePriceId: p.stripePriceId,
          razorpayPlanId: p.razorpayPlanId,
        })),
      },
    })

    this.eventEmitter.emit('subscription-plan.created', { planId: plan.id })
    return plan
  }

  async findById(id: string) {
    const plan = await this.planRepository.findById(id, {
      features: true,
      prices: true,
    })

    if (!plan) {
      throw new NotFoundException('Subscription plan not found')
    }

    return plan
  }

  async findByTier(tier: PlanTier) {
    return this.planRepository.findByTier(tier)
  }

  async findAll(includeInactive = false) {
    return this.planRepository.findAll(includeInactive)
  }

  async findActive() {
    return this.planRepository.findActive()
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    await this.findById(id)

    const updated = await this.planRepository.update(id, {
      name: dto.name,
      description: dto.description,
      displayOrder: dto.displayOrder,
      isPopular: dto.isPopular,
      trialDays: dto.trialDays,
      isActive: dto.isActive,
      isPublic: dto.isPublic,
    })

    this.eventEmitter.emit('subscription-plan.updated', { planId: id })
    return updated
  }

  async deactivate(id: string) {
    await this.findById(id)
    return this.planRepository.update(id, { isActive: false })
  }

  async activate(id: string) {
    await this.findById(id)
    return this.planRepository.update(id, { isActive: true })
  }

  async getFeatures(planId: string) {
    const plan = await this.findById(planId)
    return (plan as any).features || []
  }

  async getPrices(planId: string) {
    const plan = await this.findById(planId)
    return (plan as any).prices || []
  }
}
