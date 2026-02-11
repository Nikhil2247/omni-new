// ============================================================================
// SERVICE TYPE LOOKUP SERVICE - Cached Service Type Data
// ============================================================================
// Provides fast lookup for vendor service types with in-memory caching
// ============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export interface ServiceTypeLookup {
  id: string
  name: string
  slug: string
  description?: string
  categoryId: string
  isActive: boolean
}

@Injectable()
export class ServiceTypeLookupService implements OnModuleInit {
  private readonly logger = new Logger(ServiceTypeLookupService.name)

  private serviceTypes: Map<string, ServiceTypeLookup> = new Map()
  private serviceTypesBySlug: Map<string, ServiceTypeLookup> = new Map()
  private serviceTypesByCategory: Map<string, ServiceTypeLookup[]> = new Map()

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadAllData()
  }

  private async loadAllData(): Promise<void> {
    this.logger.log('Loading service type lookup data...')

    try {
      const serviceTypeRecords = await this.prisma.serviceType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })

      this.serviceTypes.clear()
      this.serviceTypesBySlug.clear()
      this.serviceTypesByCategory.clear()

      for (const serviceType of serviceTypeRecords) {
        const lookup: ServiceTypeLookup = {
          id: serviceType.id,
          name: serviceType.name,
          slug: serviceType.slug,
          description: serviceType.description || undefined,
          categoryId: serviceType.categoryId,
          isActive: serviceType.isActive,
        }

        this.serviceTypes.set(serviceType.id, lookup)
        this.serviceTypesBySlug.set(serviceType.slug, lookup)

        // Group by category
        const categoryTypes = this.serviceTypesByCategory.get(serviceType.categoryId) || []
        categoryTypes.push(lookup)
        this.serviceTypesByCategory.set(serviceType.categoryId, categoryTypes)
      }

      this.logger.log(`Loaded ${this.serviceTypes.size} service types`)
    } catch (error) {
      this.logger.error('Failed to load service type lookup data', error)
    }
  }

  async refresh(): Promise<void> {
    await this.loadAllData()
  }

  // Lookups
  getAllServiceTypes(): ServiceTypeLookup[] {
    return Array.from(this.serviceTypes.values())
  }

  getServiceTypeById(id: string): ServiceTypeLookup | undefined {
    return this.serviceTypes.get(id)
  }

  getServiceTypeBySlug(slug: string): ServiceTypeLookup | undefined {
    return this.serviceTypesBySlug.get(slug)
  }

  getServiceTypesByCategory(categoryId: string): ServiceTypeLookup[] {
    return this.serviceTypesByCategory.get(categoryId) || []
  }

  // Get service types for multiple categories
  getServiceTypesByCategories(categoryIds: string[]): ServiceTypeLookup[] {
    const result: ServiceTypeLookup[] = []
    for (const categoryId of categoryIds) {
      const types = this.serviceTypesByCategory.get(categoryId) || []
      result.push(...types)
    }
    return result
  }

  // Validation
  isValidServiceType(id: string): boolean {
    return this.serviceTypes.has(id)
  }

  isValidServiceTypeSlug(slug: string): boolean {
    return this.serviceTypesBySlug.has(slug)
  }

  // Check if service type belongs to category
  isServiceTypeInCategory(serviceTypeId: string, categoryId: string): boolean {
    const serviceType = this.serviceTypes.get(serviceTypeId)
    return serviceType?.categoryId === categoryId
  }
}
