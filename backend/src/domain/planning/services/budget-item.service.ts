// ============================================================================
// BUDGET ITEM SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { BudgetItem, Prisma } from '@prisma/client'
import { BudgetItemRepository } from '../repositories/budget-item.repository'
import { CreateBudgetItemDto, UpdateBudgetItemDto } from '../dto/budget-item.dto'

@Injectable()
export class BudgetItemService {
  private readonly logger = new Logger(BudgetItemService.name)

  constructor(
    private readonly budgetItemRepository: BudgetItemRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(budgetId: string, dto: CreateBudgetItemDto): Promise<BudgetItem> {
    this.logger.log(`Creating budget item for budget: ${budgetId}`)

    const item = await this.budgetItemRepository.create({
      budget: { connect: { id: budgetId } },
      category: dto.category,
      name: dto.name,
      estimatedCost: dto.estimatedCost !== undefined ? new Prisma.Decimal(dto.estimatedCost) : undefined,
      actualCost: dto.actualCost !== undefined ? new Prisma.Decimal(dto.actualCost) : undefined,
      isPaid: dto.isPaid ?? false,
      notes: dto.notes,
    })

    this.eventEmitter.emit('budget-item.created', { itemId: item.id, budgetId })
    return item
  }

  async findById(id: string): Promise<BudgetItem> {
    const item = await this.budgetItemRepository.findById(id)
    if (!item) {
      throw new NotFoundException('Budget item not found')
    }
    return item
  }

  async findByBudget(budgetId: string): Promise<BudgetItem[]> {
    return this.budgetItemRepository.findByBudget(budgetId)
  }

  async findByCategory(budgetId: string, category: string): Promise<BudgetItem[]> {
    return this.budgetItemRepository.findByCategory(budgetId, category)
  }

  async update(id: string, dto: UpdateBudgetItemDto): Promise<BudgetItem> {
    await this.findById(id)

    const updateData: Prisma.BudgetItemUpdateInput = {}
    if (dto.category !== undefined) updateData.category = dto.category
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.estimatedCost !== undefined) updateData.estimatedCost = new Prisma.Decimal(dto.estimatedCost)
    if (dto.actualCost !== undefined) updateData.actualCost = new Prisma.Decimal(dto.actualCost)
    if (dto.isPaid !== undefined) updateData.isPaid = dto.isPaid
    if (dto.notes !== undefined) updateData.notes = dto.notes

    const updated = await this.budgetItemRepository.update(id, updateData)
    this.eventEmitter.emit('budget-item.updated', { itemId: id })
    return updated
  }

  async markAsPaid(id: string, actualCost?: number): Promise<BudgetItem> {
    await this.findById(id)

    const updateData: Prisma.BudgetItemUpdateInput = {
      isPaid: true,
    }
    if (actualCost !== undefined) {
      updateData.actualCost = new Prisma.Decimal(actualCost)
    }

    return this.budgetItemRepository.update(id, updateData)
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.budgetItemRepository.delete(id)
    this.eventEmitter.emit('budget-item.deleted', { itemId: id })
  }

  async getCategoryBreakdown(budgetId: string) {
    return this.budgetItemRepository.getCategoryBreakdown(budgetId)
  }

  async getTotals(budgetId: string) {
    return this.budgetItemRepository.getTotals(budgetId)
  }
}
