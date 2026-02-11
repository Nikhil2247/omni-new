// ============================================================================
// PAYMENT METHOD REPOSITORY - Subscription Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { Prisma, PaymentMethod } from '@prisma/client'

@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PaymentMethodCreateInput): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.create({ data })
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { id },
    })
  }

  async findBySubscription(subscriptionId: string): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: { subscriptionId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async findDefault(subscriptionId: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({
      where: {
        subscriptionId,
        isDefault: true,
      },
    })
  }

  async update(id: string, data: Prisma.PaymentMethodUpdateInput): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({ where: { id } })
  }

  async unsetDefaults(subscriptionId: string): Promise<void> {
    await this.prisma.paymentMethod.updateMany({
      where: {
        subscriptionId,
        isDefault: true,
      },
      data: { isDefault: false },
    })
  }
}
