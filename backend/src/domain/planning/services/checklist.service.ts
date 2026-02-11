// ============================================================================
// CHECKLIST SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Checklist, ChecklistItem } from '@prisma/client'
import { ChecklistRepository } from '../repositories/checklist.repository'
import { CreateChecklistDto, UpdateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto } from '../dto/checklist.dto'
import { PrismaService } from '../../../core/database/prisma.service'

@Injectable()
export class ChecklistService {
  private readonly logger = new Logger(ChecklistService.name)

  constructor(
    private readonly checklistRepository: ChecklistRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateChecklistDto): Promise<Checklist> {
    this.logger.log(`Creating checklist: ${dto.name} for event: ${dto.eventId}`)

    const checklist = await this.checklistRepository.create({
      event: { connect: { id: dto.eventId } },
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
      items: dto.items ? {
        create: dto.items.map((item, index) => ({
          title: item.title,
          description: item.description,
          dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
          sortOrder: item.sortOrder ?? index,
        })),
      } : undefined,
    }, {
      items: true,
    })

    this.eventEmitter.emit('checklist.created', { checklistId: checklist.id, eventId: dto.eventId })
    return checklist
  }

  async findById(id: string): Promise<Checklist> {
    const checklist = await this.checklistRepository.findWithItems(id)
    if (!checklist) {
      throw new NotFoundException('Checklist not found')
    }
    return checklist
  }

  async findByEventId(eventId: string): Promise<Checklist[]> {
    return this.checklistRepository.findByEventId(eventId, true)
  }

  async update(id: string, dto: UpdateChecklistDto): Promise<Checklist> {
    await this.findById(id)
    return this.checklistRepository.update(id, dto, { items: true })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.checklistRepository.delete(id)
    this.eventEmitter.emit('checklist.deleted', { checklistId: id })
  }

  // ============================================================================
  // CHECKLIST ITEM OPERATIONS
  // ============================================================================

  async addItem(checklistId: string, dto: CreateChecklistItemDto): Promise<ChecklistItem> {
    await this.findById(checklistId)

    const item = await this.prisma.checklistItem.create({
      data: {
        checklist: { connect: { id: checklistId } },
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        sortOrder: dto.sortOrder ?? 0,
      },
    })

    this.eventEmitter.emit('checklist-item.added', { itemId: item.id, checklistId })
    return item
  }

  async updateItem(itemId: string, dto: UpdateChecklistItemDto): Promise<ChecklistItem> {
    const item = await this.prisma.checklistItem.findUnique({ where: { id: itemId } })
    if (!item) {
      throw new NotFoundException('Checklist item not found')
    }

    const updated = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        isCompleted: dto.isCompleted,
        completedAt: dto.isCompleted && !item.isCompleted ? new Date() : dto.isCompleted === false ? null : undefined,
        sortOrder: dto.sortOrder,
      },
    })

    if (dto.isCompleted !== undefined && dto.isCompleted !== item.isCompleted) {
      this.eventEmitter.emit('checklist-item.toggled', { itemId, isCompleted: dto.isCompleted })
    }

    return updated
  }

  async deleteItem(itemId: string): Promise<void> {
    const item = await this.prisma.checklistItem.findUnique({ where: { id: itemId } })
    if (!item) {
      throw new NotFoundException('Checklist item not found')
    }

    await this.prisma.checklistItem.delete({ where: { id: itemId } })
    this.eventEmitter.emit('checklist-item.deleted', { itemId, checklistId: item.checklistId })
  }

  async getCompletionStats(checklistId: string) {
    return this.checklistRepository.getCompletionStats(checklistId)
  }
}
