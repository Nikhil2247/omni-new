// ============================================================================
// SERVICE SERVICE - Catalog Domain
// ============================================================================

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PricingType as PrismaPricingType, Service } from '@prisma/client';
import { ServiceRepository } from '../repositories/service.repository';
import {
  CreateServiceDto,
  DurationUnit,
  UpdateServiceDto,
} from '../dto/service.dto';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';
import { UsageService } from '../../subscription/services/usage.service';
const { Decimal } = Prisma;

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly usageService: UsageService,
  ) {}

  private normalizeDurationToMinutes(
    duration?: number,
    durationValue?: number,
    durationUnit?: DurationUnit,
  ): number | undefined {
    const baseValue = durationValue ?? duration;

    if (baseValue === undefined || baseValue === null) {
      return undefined;
    }

    if (!Number.isFinite(baseValue) || baseValue <= 0) {
      return undefined;
    }

    switch (durationUnit) {
      case DurationUnit.HOURS:
        return Math.round(baseValue * 60);
      case DurationUnit.DAY:
        return Math.round(baseValue * 24 * 60);
      case DurationUnit.MONTH:
        return Math.round(baseValue * 30 * 24 * 60);
      case DurationUnit.MINUTES:
      default:
        return Math.round(baseValue);
    }
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    this.logger.log(`Creating service for vendor: ${dto.vendorProfileId}`);

    // Check services_limit before creating
    try {
      const limitStatus = await this.usageService.checkFeatureLimit(
        dto.vendorProfileId,
        'services_limit',
      );

      if (!limitStatus.isUnlimited && limitStatus.limit > 0) {
        // Get current service count for this vendor
        const currentCount = await this.prisma.service.count({
          where: { vendorProfileId: dto.vendorProfileId },
        });

        if (currentCount >= limitStatus.limit) {
          throw new ForbiddenException({
            message: 'Services limit reached',
            error: 'SERVICES_LIMIT_EXCEEDED',
            details: {
              currentCount,
              limit: limitStatus.limit,
              planUpgradeRequired: true,
            },
            userMessage: `You have reached the maximum of ${limitStatus.limit} services on your current plan. Please upgrade your subscription to add more services.`,
          });
        }

        this.logger.debug(
          `Services limit check passed: ${currentCount}/${limitStatus.limit} services used`,
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Log but don't block if usage service fails - graceful degradation for new vendors
      this.logger.warn(`Failed to check services limit: ${error.message}`);
    }

    const resolvedPricingType =
      dto.pricingType ??
      (dto.basePrice !== undefined
        ? PrismaPricingType.FIXED
        : PrismaPricingType.STARTING_AT);
    const resolvedStartingPrice = dto.startingPrice ?? dto.basePrice;
    const hasPricingTiers = !!dto.pricingTiers?.length;
    const normalizedDuration = this.normalizeDurationToMinutes(
      dto.duration,
      dto.durationValue,
      dto.durationUnit,
    );

    if (normalizedDuration !== undefined) {
      this.logger.debug(
        `Normalized service duration to ${normalizedDuration} minutes`,
      );
    }

    // Determine if this is an item-based service
    const hasItems = dto.hasItems || (dto.items && dto.items.length > 0);
    const finalPricingType = hasItems
      ? PrismaPricingType.ITEM_BASED
      : hasPricingTiers
        ? PrismaPricingType.TIERED
        : (resolvedPricingType as any);

    const service = await this.serviceRepository.create(
      {
        vendorProfile: { connect: { id: dto.vendorProfileId } },
        serviceType: dto.serviceTypeId
          ? { connect: { id: dto.serviceTypeId } }
          : undefined,
        name: dto.name,
        description: dto.description,
        pricingType: finalPricingType,
        currency: dto.currency ?? 'INR',
        startingPrice:
          resolvedStartingPrice !== undefined
            ? new Decimal(resolvedStartingPrice)
            : undefined,
        maxPrice:
          dto.maxPrice !== undefined ? new Decimal(dto.maxPrice) : undefined,
        hasItems: hasItems ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        pricingTiers: dto.pricingTiers
          ? {
              create: dto.pricingTiers.map((tier, index) => ({
                name: tier.name,
                description: tier.description,
                price: new Decimal(tier.price),
                unit: tier.unit,
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                sortOrder: tier.sortOrder ?? index,
              })),
            }
          : undefined,
        items: dto.items
          ? {
              create: dto.items.map((item, index) => ({
                name: item.name,
                description: item.description,
                imageUrl: item.imageUrl,
                price: new Decimal(item.price),
                currency: item.currency ?? 'INR',
                unit: item.unit,
                minQuantity: item.minQuantity ?? 1,
                maxQuantity: item.maxQuantity,
                isActive: item.isActive ?? true,
                isRequired: item.isRequired ?? false,
                sortOrder: item.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      {
        pricingTiers: true,
        serviceType: true,
        items: true,
      },
    );

    this.eventEmitter.emit('service.created', {
      serviceId: service.id,
      vendorProfileId: dto.vendorProfileId,
    });
    return service;
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findById(id, {
      pricingTiers: true,
      serviceType: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async findByVendorProfile(vendorProfileId: string, includeInactive = false) {
    return this.serviceRepository.findByVendorProfile(
      vendorProfileId,
      includeInactive,
    );
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    await this.findById(id);

    const resolvedStartingPrice = dto.startingPrice ?? dto.basePrice;
    const normalizedDuration = this.normalizeDurationToMinutes(
      dto.duration,
      dto.durationValue,
      dto.durationUnit,
    );

    if (normalizedDuration !== undefined) {
      this.logger.debug(
        `Normalized service duration to ${normalizedDuration} minutes`,
      );
    }

    return this.serviceRepository.update(
      id,
      {
        name: dto.name,
        description: dto.description,
        pricingType: dto.pricingType as any,
        currency: dto.currency,
        startingPrice:
          resolvedStartingPrice !== undefined
            ? new Decimal(resolvedStartingPrice)
            : undefined,
        maxPrice:
          dto.maxPrice !== undefined ? new Decimal(dto.maxPrice) : undefined,
        hasItems: dto.hasItems,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
      { pricingTiers: true, serviceType: true, items: { orderBy: { sortOrder: 'asc' } } },
    );
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.serviceRepository.delete(id);
    this.eventEmitter.emit('service.deleted', { serviceId: id });
  }

  async addPricingTier(
    serviceId: string,
    tier: {
      name: string;
      price: number;
      unit: string;
      description?: string;
      minQuantity?: number;
      maxQuantity?: number;
      sortOrder?: number;
    },
  ) {
    await this.findById(serviceId);

    const created = await this.prisma.pricingTier.create({
      data: {
        service: { connect: { id: serviceId } },
        name: tier.name,
        description: tier.description,
        price: new Decimal(tier.price),
        unit: tier.unit,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        sortOrder: tier.sortOrder ?? 0,
      },
    });

    this.eventEmitter.emit('service.pricing-tier-added', {
      serviceId,
      tierId: created.id,
    });
    return created;
  }
}
