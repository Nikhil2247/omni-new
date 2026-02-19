// ============================================================================
// CHECKLIST ITEM SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChecklistItem } from '@prisma/client';
import { ChecklistItemRepository } from '../repositories/checklist-item.repository';
import {
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from '../dto/checklist-item.dto';

@Injectable()
export class ChecklistItemService {
  private readonly logger = new Logger(ChecklistItemService.name);

  constructor(
    private readonly checklistItemRepository: ChecklistItemRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    checklistId: string,
    dto: CreateChecklistItemDto,
  ): Promise<ChecklistItem> {
    this.logger.log(`Creating checklist item for checklist: ${checklistId}`);

    const item = await this.checklistItemRepository.create({
      checklist: { connect: { id: checklistId } },
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      sortOrder: dto.sortOrder ?? 0,
    });

    this.eventEmitter.emit('checklist-item.created', {
      itemId: item.id,
      checklistId,
    });
    return item;
  }

  async findById(id: string): Promise<ChecklistItem> {
    const item = await this.checklistItemRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }
    return item;
  }

  async findByChecklist(checklistId: string): Promise<ChecklistItem[]> {
    return this.checklistItemRepository.findByChecklist(checklistId);
  }

  async update(
    id: string,
    dto: UpdateChecklistItemDto,
  ): Promise<ChecklistItem> {
    await this.findById(id);
    return this.checklistItemRepository.update(id, dto);
  }

  async toggleComplete(id: string): Promise<ChecklistItem> {
    const item = await this.findById(id);
    const updated = await this.checklistItemRepository.update(id, {
      isCompleted: !item.isCompleted,
      completedAt: !item.isCompleted ? new Date() : null,
    });

    this.eventEmitter.emit('checklist-item.toggled', {
      itemId: id,
      isCompleted: updated.isCompleted,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.checklistItemRepository.delete(id);
    this.eventEmitter.emit('checklist-item.deleted', { itemId: id });
  }

  async getCompletionStats(checklistId: string) {
    return this.checklistItemRepository.getCompletionStats(checklistId);
  }
}
