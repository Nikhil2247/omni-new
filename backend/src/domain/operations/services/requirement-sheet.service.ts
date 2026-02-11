// ============================================================================
// REQUIREMENT SHEET SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequirementSheet, RequirementItem } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { RequirementSheetRepository } from '../repositories';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateRequirementSheetDto, UpdateRequirementSheetDto } from '../dto';
import { Decimal } from '@prisma/client/runtime/client';
import {
  UpdateRequirementItemDto,
  CreateRequirementItemDto,
} from '../dto/requirement-item.dto';

@Injectable()
export class RequirementSheetService {
  private readonly logger = new Logger(RequirementSheetService.name);

  constructor(
    private readonly requirementSheetRepository: RequirementSheetRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateRequirementSheetDto,
    createdBy: string,
  ): Promise<RequirementSheet> {
    this.logger.log(
      `Creating requirement sheet for active event: ${dto.activeEventId}`,
    );

    const existing = await this.requirementSheetRepository.findByActiveEvent(
      dto.activeEventId,
    );
    if (existing) {
      throw new ConflictException(
        'Requirement sheet already exists for this active event',
      );
    }

    const sheet = await this.requirementSheetRepository.create(
      {
        activeEvent: { connect: { id: dto.activeEventId } },
        notes: dto.notes,
        createdBy,
        items: dto.items
          ? {
              create: dto.items.map((item) => ({
                category: item.category,
                description: item.description,
                quantity: item.quantity ?? 1,
                estimatedBudget: item.estimatedBudget
                  ? new Decimal(item.estimatedBudget)
                  : undefined,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      {
        items: true,
      },
    );

    this.eventEmitter.emit('requirement-sheet.created', {
      sheetId: sheet.id,
      activeEventId: dto.activeEventId,
    });
    return sheet;
  }

  async findById(id: string): Promise<RequirementSheet> {
    const sheet = await this.requirementSheetRepository.findById(id, {
      items: true,
    });
    if (!sheet) {
      throw new NotFoundException('Requirement sheet not found');
    }
    return sheet;
  }

  async findByActiveEvent(
    activeEventId: string,
  ): Promise<RequirementSheet | null> {
    return this.requirementSheetRepository.findByActiveEvent(activeEventId);
  }

  async update(
    id: string,
    dto: UpdateRequirementSheetDto,
  ): Promise<RequirementSheet> {
    await this.findById(id);
    return this.requirementSheetRepository.update(
      id,
      { notes: dto.notes },
      { items: true },
    );
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.requirementSheetRepository.delete(id);
    this.eventEmitter.emit('requirement-sheet.deleted', { sheetId: id });
  }

  // =========================================================================
  // ITEM OPERATIONS
  // =========================================================================

  async addItem(
    sheetId: string,
    dto: CreateRequirementItemDto,
  ): Promise<RequirementItem> {
    await this.findById(sheetId);

    const item = await this.prisma.requirementItem.create({
      data: {
        requirementSheet: { connect: { id: sheetId } },
        category: dto.category,
        description: dto.description,
        quantity: dto.quantity ?? 1,
        estimatedBudget: dto.estimatedBudget
          ? new Decimal(dto.estimatedBudget)
          : undefined,
        notes: dto.notes,
      },
    });

    this.eventEmitter.emit('requirement-item.created', {
      itemId: item.id,
      sheetId,
    });
    return item;
  }

  async updateItem(
    itemId: string,
    dto: UpdateRequirementItemDto,
  ): Promise<RequirementItem> {
    const existing = await this.prisma.requirementItem.findUnique({
      where: { id: itemId },
    });
    if (!existing) {
      throw new NotFoundException('Requirement item not found');
    }

    const updated = await this.prisma.requirementItem.update({
      where: { id: itemId },
      data: {
        category: dto.category,
        description: dto.description,
        quantity: dto.quantity,
        estimatedBudget: dto.estimatedBudget
          ? new Decimal(dto.estimatedBudget)
          : undefined,
        status: dto.status,
        notes: dto.notes,
      },
    });

    this.eventEmitter.emit('requirement-item.updated', { itemId });
    return updated;
  }

  async deleteItem(itemId: string): Promise<void> {
    const existing = await this.prisma.requirementItem.findUnique({
      where: { id: itemId },
    });
    if (!existing) {
      throw new NotFoundException('Requirement item not found');
    }

    await this.prisma.requirementItem.delete({ where: { id: itemId } });
    this.eventEmitter.emit('requirement-item.deleted', { itemId });
  }
}
