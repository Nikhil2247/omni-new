// ============================================================================
// BUDGET SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Budget, BudgetItem, Prisma } from '@prisma/client'
import { BudgetRepository } from '../repositories/budget.repository'
import { CreateBudgetDto, UpdateBudgetDto, CreateBudgetItemDto, UpdateBudgetItemDto } from '../dto/budget.dto'

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name)

  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateBudgetDto): Promise<Budget> {
    // Check if budget already exists for event
    const existing = await this.budgetRepository.findByEventId(dto.eventId)
    if (existing) {
      throw new ConflictException('Budget already exists for this event')
    }

    const budget = await this.budgetRepository.create({
      event: { connect: { id: dto.eventId } },
      totalBudget: new Prisma.Decimal(dto.totalBudget),
      items: dto.items ? {
        create: dto.items.map(item => ({
          category: item.category,
          name: item.name,
          estimatedCost: item.estimatedCost !== undefined ? new Prisma.Decimal(item.estimatedCost) : undefined,
          actualCost: item.actualCost !== undefined ? new Prisma.Decimal(item.actualCost) : undefined,
          isPaid: item.isPaid ?? false,
          notes: item.notes,
        })),
      } : undefined,
    }, {
      items: true,
    })

    this.eventEmitter.emit('budget.created', { budgetId: budget.id, eventId: dto.eventId })
    return budget
  }

  async findById(id: string): Promise<Budget> {
    const budget = await this.budgetRepository.findWithItems(id)
    if (!budget) {
      throw new NotFoundException('Budget not found')
    }
    return budget
  }

  async findByEventId(eventId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findByEventId(eventId)
    if (!budget) {
      throw new NotFoundException('Budget not found for this event')
    }
    return budget
  }

  async update(id: string, dto: UpdateBudgetDto): Promise<Budget> {
    await this.findById(id)

    const updated = await this.budgetRepository.update(id, {
      totalBudget: dto.totalBudget !== undefined ? new Prisma.Decimal(dto.totalBudget) : undefined,
    }, {
      items: true,
    })

    this.eventEmitter.emit('budget.updated', { budgetId: id })
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.budgetRepository.delete(id)
    this.eventEmitter.emit('budget.deleted', { budgetId: id })
  }

  // ============================================================================
  // BUDGET ITEM OPERATIONS
  // ============================================================================

  async addItem(budgetId: string, dto: CreateBudgetItemDto): Promise<BudgetItem> {
    await this.findById(budgetId)

    const item = await this.budgetRepository.addItem(budgetId, {
      budget: { connect: { id: budgetId } },
      category: dto.category,
      name: dto.name,
      estimatedCost: dto.estimatedCost !== undefined ? new Prisma.Decimal(dto.estimatedCost) : undefined,
      actualCost: dto.actualCost !== undefined ? new Prisma.Decimal(dto.actualCost) : undefined,
      isPaid: dto.isPaid ?? false,
      notes: dto.notes,
    })
    this.eventEmitter.emit('budget-item.added', { itemId: item.id, budgetId })
    return item
  }

  async updateItem(itemId: string, dto: UpdateBudgetItemDto): Promise<BudgetItem> {
    const item = await this.budgetRepository.findItemById(itemId)
    if (!item) {
      throw new NotFoundException('Budget item not found')
    }

    const updated = await this.budgetRepository.updateItem(itemId, {
      category: dto.category,
      name: dto.name,
      estimatedCost: dto.estimatedCost !== undefined ? new Prisma.Decimal(dto.estimatedCost) : undefined,
      actualCost: dto.actualCost !== undefined ? new Prisma.Decimal(dto.actualCost) : undefined,
      isPaid: dto.isPaid,
      notes: dto.notes,
    })
    this.eventEmitter.emit('budget-item.updated', { itemId, budgetId: item.budgetId })
    return updated
  }

  async deleteItem(itemId: string): Promise<void> {
    const item = await this.budgetRepository.findItemById(itemId)
    if (!item) {
      throw new NotFoundException('Budget item not found')
    }

    const budgetId = item.budgetId
    await this.budgetRepository.deleteItem(itemId)
    this.eventEmitter.emit('budget-item.deleted', { itemId, budgetId })
  }

  async getTotals(budgetId: string) {
    const budget = await this.findById(budgetId)
    const totals = await this.budgetRepository.calculateTotals(budgetId)
    const totalBudgetValue = budget.totalBudget ? Number(budget.totalBudget) : 0

    return {
      totalBudget: totalBudgetValue,
      totalEstimated: Number(totals.totalEstimated),
      totalActual: Number(totals.totalActual),
      remaining: totalBudgetValue - Number(totals.totalActual),
      percentSpent: totalBudgetValue > 0 
        ? Math.round((Number(totals.totalActual) / totalBudgetValue) * 100)
        : 0,
    }
  }

  async getCategoryBreakdown(budgetId: string) {
    await this.findById(budgetId)
    return this.budgetRepository.getCategoryBreakdown(budgetId)
  }

  // Totals are computed on demand from budget items.
}
