// ============================================================================
// SERVICE ITEM REPOSITORY
// ============================================================================
// Repository for managing service items (menu items within services)
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { ServiceItem, Prisma } from '@prisma/client';

@Injectable()
export class ServiceItemRepository extends BaseRepository<
  ServiceItem,
  Prisma.ServiceItemCreateInput,
  Prisma.ServiceItemUpdateInput,
  Prisma.ServiceItemWhereInput,
  Prisma.ServiceItemWhereUniqueInput,
  Prisma.ServiceItemOrderByWithRelationInput
> {
  protected readonly modelName = 'ServiceItem';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.serviceItem;
  }

  /**
   * Find all items for a service
   */
  async findByService(serviceId: string, includeInactive = false) {
    return this.model.findMany({
      where: {
        serviceId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Find active items for a service
   */
  async findActiveByService(serviceId: string) {
    return this.model.findMany({
      where: {
        serviceId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Count items for a service
   */
  async countByService(serviceId: string, activeOnly = true) {
    return this.model.count({
      where: {
        serviceId,
        ...(activeOnly ? { isActive: true } : {}),
      },
    });
  }

  /**
   * Bulk create items for a service
   */
  async createMany(
    serviceId: string,
    items: Omit<Prisma.ServiceItemCreateInput, 'service'>[],
  ) {
    return this.prisma.$transaction(
      items.map((item, index) =>
        this.model.create({
          data: {
            ...item,
            sortOrder: item.sortOrder ?? index,
            service: { connect: { id: serviceId } },
          },
        }),
      ),
    );
  }

  /**
   * Delete all items for a service
   */
  async deleteByService(serviceId: string) {
    return this.model.deleteMany({
      where: { serviceId },
    });
  }

  /**
   * Update sort order for multiple items
   */
  async updateSortOrder(itemIds: string[]) {
    return this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.model.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  /**
   * Get the next sort order for a service
   */
  async getNextSortOrder(serviceId: string): Promise<number> {
    const lastItem = await this.model.findFirst({
      where: { serviceId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return (lastItem?.sortOrder ?? -1) + 1;
  }

  /**
   * Calculate total price of all active required items
   */
  async calculateRequiredItemsTotal(serviceId: string): Promise<number> {
    const result = await this.model.aggregate({
      where: {
        serviceId,
        isActive: true,
        isRequired: true,
      },
      _sum: {
        price: true,
      },
    });
    return Number(result._sum.price || 0);
  }

  /**
   * Get price range of items for a service
   */
  async getPriceRange(serviceId: string): Promise<{ min: number; max: number }> {
    const result = await this.model.aggregate({
      where: {
        serviceId,
        isActive: true,
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
    });
    return {
      min: Number(result._min.price || 0),
      max: Number(result._max.price || 0),
    };
  }
}
