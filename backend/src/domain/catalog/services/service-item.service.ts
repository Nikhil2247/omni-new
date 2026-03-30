// ============================================================================
// SERVICE ITEM SERVICE - Catalog Domain
// ============================================================================
// Business logic for managing service items (menu items within services)
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ServiceItem } from '@prisma/client';
import { ServiceItemRepository } from '../repositories/service-item.repository';
import { ServiceRepository } from '../repositories/service.repository';
import {
  CreateServiceItemDto,
  UpdateServiceItemDto,
} from '../dto/service-item.dto';
import { PrismaService } from '../../../core/database/prisma.service';

const { Decimal } = Prisma;

@Injectable()
export class ServiceItemService {
  private readonly logger = new Logger(ServiceItemService.name);

  constructor(
    private readonly serviceItemRepository: ServiceItemRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new service item
   */
  async create(serviceId: string, dto: CreateServiceItemDto): Promise<ServiceItem> {
    this.logger.log(`Creating service item for service: ${serviceId}`);

    // Verify service exists
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Get next sort order if not provided
    const sortOrder = dto.sortOrder ?? await this.serviceItemRepository.getNextSortOrder(serviceId);

    const item = await this.serviceItemRepository.create(
      {
        service: { connect: { id: serviceId } },
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        price: new Decimal(dto.price),
        currency: dto.currency ?? 'INR',
        unit: dto.unit,
        minQuantity: dto.minQuantity ?? 1,
        maxQuantity: dto.maxQuantity,
        isActive: dto.isActive ?? true,
        isRequired: dto.isRequired ?? false,
        sortOrder,
      },
    );

    // Update service hasItems flag if needed
    if (!service.hasItems) {
      await this.serviceRepository.update(serviceId, { hasItems: true });
    }

    this.eventEmitter.emit('service-item.created', {
      itemId: item.id,
      serviceId,
    });

    return item;
  }

  /**
   * Create multiple items for a service (bulk create)
   */
  async createMany(
    serviceId: string,
    items: CreateServiceItemDto[],
  ): Promise<ServiceItem[]> {
    this.logger.log(`Creating ${items.length} service items for service: ${serviceId}`);

    // Verify service exists
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const createdItems = await this.serviceItemRepository.createMany(
      serviceId,
      items.map((item, index) => ({
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
    );

    // Update service hasItems flag if needed
    if (!service.hasItems && createdItems.length > 0) {
      await this.serviceRepository.update(serviceId, { hasItems: true });
    }

    this.eventEmitter.emit('service-items.created', {
      itemIds: createdItems.map((i) => i.id),
      serviceId,
      count: createdItems.length,
    });

    return createdItems;
  }

  /**
   * Find item by ID
   */
  async findById(id: string): Promise<ServiceItem> {
    const item = await this.serviceItemRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Service item not found');
    }
    return item;
  }

  /**
   * Find all items for a service
   */
  async findByService(serviceId: string, includeInactive = false): Promise<ServiceItem[]> {
    return this.serviceItemRepository.findByService(serviceId, includeInactive);
  }

  /**
   * Update a service item
   */
  async update(id: string, dto: UpdateServiceItemDto): Promise<ServiceItem> {
    const item = await this.findById(id);

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.price !== undefined) updateData.price = new Decimal(dto.price);
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.minQuantity !== undefined) updateData.minQuantity = dto.minQuantity;
    if (dto.maxQuantity !== undefined) updateData.maxQuantity = dto.maxQuantity;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isRequired !== undefined) updateData.isRequired = dto.isRequired;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const updated = await this.serviceItemRepository.update(id, updateData);

    this.eventEmitter.emit('service-item.updated', {
      itemId: id,
      serviceId: item.serviceId,
    });

    return updated;
  }

  /**
   * Delete a service item
   */
  async delete(id: string): Promise<void> {
    const item = await this.findById(id);
    const serviceId = item.serviceId;

    await this.serviceItemRepository.delete(id);

    // Check if service still has items
    const remainingCount = await this.serviceItemRepository.countByService(serviceId, false);
    if (remainingCount === 0) {
      await this.serviceRepository.update(serviceId, { hasItems: false });
    }

    this.eventEmitter.emit('service-item.deleted', {
      itemId: id,
      serviceId,
    });
  }

  /**
   * Reorder items for a service
   */
  async reorder(serviceId: string, itemIds: string[]): Promise<ServiceItem[]> {
    this.logger.log(`Reordering ${itemIds.length} items for service: ${serviceId}`);

    // Verify all items belong to the service
    const existingItems = await this.serviceItemRepository.findByService(serviceId, true);
    const existingIds = new Set(existingItems.map((i) => i.id));

    for (const id of itemIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Item ${id} does not belong to this service`);
      }
    }

    await this.serviceItemRepository.updateSortOrder(itemIds);

    this.eventEmitter.emit('service-items.reordered', {
      serviceId,
      itemIds,
    });

    return this.findByService(serviceId, true);
  }

  /**
   * Sync items for a service (create/update/delete based on provided array)
   * Items with id are updated, items without id are created
   * Items not in the array but exist in DB are deleted
   */
  async syncItems(
    serviceId: string,
    items: (CreateServiceItemDto & { id?: string })[],
  ): Promise<ServiceItem[]> {
    this.logger.log(`Syncing ${items.length} items for service: ${serviceId}`);

    // Verify service exists
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Get existing items
    const existingItems = await this.serviceItemRepository.findByService(serviceId, true);
    const existingMap = new Map(existingItems.map((i) => [i.id, i]));

    const providedIds = new Set(items.filter((i) => i.id).map((i) => i.id!));
    const toDelete = existingItems.filter((i) => !providedIds.has(i.id));
    const toCreate = items.filter((i) => !i.id);
    const toUpdate = items.filter((i) => i.id && existingMap.has(i.id));

    // Execute in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete removed items
      if (toDelete.length > 0) {
        await tx.serviceItem.deleteMany({
          where: { id: { in: toDelete.map((i) => i.id) } },
        });
      }

      // Update existing items
      for (const item of toUpdate) {
        await tx.serviceItem.update({
          where: { id: item.id },
          data: {
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
            sortOrder: item.sortOrder ?? 0,
          },
        });
      }

      // Create new items
      for (let i = 0; i < toCreate.length; i++) {
        const item = toCreate[i];
        await tx.serviceItem.create({
          data: {
            service: { connect: { id: serviceId } },
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
            sortOrder: item.sortOrder ?? (existingItems.length + i),
          },
        });
      }
    });

    // Update hasItems flag
    const finalCount = items.length;
    await this.serviceRepository.update(serviceId, {
      hasItems: finalCount > 0,
    });

    this.eventEmitter.emit('service-items.synced', {
      serviceId,
      created: toCreate.length,
      updated: toUpdate.length,
      deleted: toDelete.length,
    });

    return this.findByService(serviceId, true);
  }

  /**
   * Get price statistics for service items
   */
  async getItemPriceStats(serviceId: string) {
    const [priceRange, requiredTotal, itemCount] = await Promise.all([
      this.serviceItemRepository.getPriceRange(serviceId),
      this.serviceItemRepository.calculateRequiredItemsTotal(serviceId),
      this.serviceItemRepository.countByService(serviceId),
    ]);

    return {
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      requiredItemsTotal: requiredTotal,
      totalItems: itemCount,
    };
  }
}
