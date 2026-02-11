// ============================================================================
// SERVICE SERVICE - Catalog Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Service } from '@prisma/client'
import { ServiceRepository } from '../repositories/service.repository'
import { CreateServiceDto, UpdateServiceDto } from '../dto/service.dto'
import { PrismaService } from '../../../core/database/prisma.service'
import { Prisma } from '@prisma/client'
const { Decimal } = Prisma

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name)

  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    this.logger.log(`Creating service for vendor: ${dto.vendorProfileId}`)

    const service = await this.serviceRepository.create({
      vendorProfile: { connect: { id: dto.vendorProfileId } },
      serviceType: dto.serviceTypeId ? { connect: { id: dto.serviceTypeId } } : undefined,
      name: dto.name,
      description: dto.description,
      pricingType: dto.pricingType as any,
      currency: dto.currency ?? 'USD',
      startingPrice: dto.startingPrice ? new Decimal(dto.startingPrice) : undefined,
      maxPrice: dto.maxPrice ? new Decimal(dto.maxPrice) : undefined,
      sortOrder: dto.sortOrder ?? 0,
      pricingTiers: dto.pricingTiers ? {
        create: dto.pricingTiers.map((tier, index) => ({
          name: tier.name,
          description: tier.description,
          price: new Decimal(tier.price),
          unit: tier.unit,
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          sortOrder: tier.sortOrder ?? index,
        })),
      } : undefined,
    }, {
      pricingTiers: true,
      serviceType: true,
    })

    this.eventEmitter.emit('service.created', { serviceId: service.id, vendorProfileId: dto.vendorProfileId })
    return service
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findById(id, { pricingTiers: true, serviceType: true })
    if (!service) {
      throw new NotFoundException('Service not found')
    }
    return service
  }

  async findByVendorProfile(vendorProfileId: string, includeInactive = false) {
    return this.serviceRepository.findByVendorProfile(vendorProfileId, includeInactive)
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    await this.findById(id)

    return this.serviceRepository.update(id, {
      name: dto.name,
      description: dto.description,
      pricingType: dto.pricingType as any,
      currency: dto.currency,
      startingPrice: dto.startingPrice ? new Decimal(dto.startingPrice) : undefined,
      maxPrice: dto.maxPrice ? new Decimal(dto.maxPrice) : undefined,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    }, { pricingTiers: true, serviceType: true })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.serviceRepository.delete(id)
    this.eventEmitter.emit('service.deleted', { serviceId: id })
  }

  async addPricingTier(serviceId: string, tier: { name: string; price: number; unit: string; description?: string; minQuantity?: number; maxQuantity?: number; sortOrder?: number }) {
    await this.findById(serviceId)

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
    })

    this.eventEmitter.emit('service.pricing-tier-added', { serviceId, tierId: created.id })
    return created
  }
}
