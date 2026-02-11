// ============================================================================
// WHATSAPP REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { Prisma, WhatsAppMessage, WhatsAppTemplate, Guest } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma.service'

type MessageWithGuest = WhatsAppMessage & { guest: Guest }

@Injectable()
export class WhatsAppRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // MESSAGES
  // ============================================================================

  async createMessage(data: Prisma.WhatsAppMessageCreateInput): Promise<WhatsAppMessage> {
    return this.prisma.whatsAppMessage.create({ data })
  }

  async createManyMessages(
    data: {
      guestId: string
      guestlistId: string
      messageType: 'INVITE' | 'REMINDER' | 'RSVP_REQUEST' | 'THANK_YOU'
      templateId?: string
      customMessage?: string
    }[],
  ): Promise<number> {
    const result = await this.prisma.whatsAppMessage.createMany({
      data: data.map((item) => ({
        guestId: item.guestId,
        guestlistId: item.guestlistId,
        messageType: item.messageType,
        templateId: item.templateId,
        customMessage: item.customMessage,
        status: 'PENDING',
      })),
    })
    return result.count
  }

  async updateMessage(id: string, data: Prisma.WhatsAppMessageUpdateInput): Promise<WhatsAppMessage> {
    return this.prisma.whatsAppMessage.update({ where: { id }, data })
  }

  async findMessagesByGuestlistId(guestlistId: string): Promise<MessageWithGuest[]> {
    return this.prisma.whatsAppMessage.findMany({
      where: { guestlistId },
      include: { guest: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findPendingMessages(limit: number = 100): Promise<MessageWithGuest[]> {
    return this.prisma.whatsAppMessage.findMany({
      where: { status: 'PENDING' },
      include: { guest: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })
  }

  async getMessageStats(guestlistId: string): Promise<{
    totalSent: number
    delivered: number
    read: number
    pending: number
    failed: number
  }> {
    const stats = await this.prisma.whatsAppMessage.groupBy({
      by: ['status'],
      where: { guestlistId },
      _count: true,
    })

    const getCount = (status: string) => stats.find((s) => s.status === status)?._count || 0

    return {
      totalSent: getCount('SENT') + getCount('DELIVERED') + getCount('READ'),
      delivered: getCount('DELIVERED') + getCount('READ'),
      read: getCount('READ'),
      pending: getCount('PENDING'),
      failed: getCount('FAILED'),
    }
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async findAllTemplates(): Promise<WhatsAppTemplate[]> {
    return this.prisma.whatsAppTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  async findTemplateById(id: string): Promise<WhatsAppTemplate | null> {
    return this.prisma.whatsAppTemplate.findUnique({ where: { id } })
  }

  async createTemplate(data: Prisma.WhatsAppTemplateCreateInput): Promise<WhatsAppTemplate> {
    return this.prisma.whatsAppTemplate.create({ data })
  }

  async updateTemplate(id: string, data: Prisma.WhatsAppTemplateUpdateInput): Promise<WhatsAppTemplate> {
    return this.prisma.whatsAppTemplate.update({ where: { id }, data })
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.prisma.whatsAppTemplate.delete({ where: { id } })
  }

  // ============================================================================
  // GUEST QUERIES
  // ============================================================================

  async findGuestsWithPhone(guestlistId: string, filter?: { rsvpStatus?: string[] }): Promise<Guest[]> {
    return this.prisma.guest.findMany({
      where: {
        guestlistId,
        phone: { not: null },
        ...(filter?.rsvpStatus && { rsvpStatus: { in: filter.rsvpStatus as any } }),
      },
    })
  }

  async findGuestsByIds(ids: string[]): Promise<Guest[]> {
    return this.prisma.guest.findMany({
      where: { id: { in: ids } },
    })
  }
}
