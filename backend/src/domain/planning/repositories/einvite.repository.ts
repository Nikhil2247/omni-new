// ============================================================================
// E-INVITE REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  EInvite,
  EInviteTemplate,
  EInviteSent,
  EInviteCategory,
  EInviteChannel,
  EInviteSentStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class EInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // TEMPLATE METHODS
  // ============================================================================

  async createTemplate(data: Prisma.EInviteTemplateCreateInput): Promise<EInviteTemplate> {
    return this.prisma.eInviteTemplate.create({ data });
  }

  async updateTemplate(
    id: string,
    data: Prisma.EInviteTemplateUpdateInput,
  ): Promise<EInviteTemplate> {
    return this.prisma.eInviteTemplate.update({
      where: { id },
      data,
    });
  }

  async findTemplateById(id: string): Promise<EInviteTemplate | null> {
    return this.prisma.eInviteTemplate.findUnique({
      where: { id },
    });
  }

  async findAllTemplates(category?: EInviteCategory): Promise<EInviteTemplate[]> {
    return this.prisma.eInviteTemplate.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.prisma.eInviteTemplate.delete({
      where: { id },
    });
  }

  // ============================================================================
  // E-INVITE METHODS
  // ============================================================================

  async create(data: Prisma.EInviteCreateInput): Promise<EInvite> {
    return this.prisma.eInvite.create({
      data,
      include: {
        template: true,
      },
    });
  }

  async update(id: string, data: Prisma.EInviteUpdateInput): Promise<EInvite> {
    return this.prisma.eInvite.update({
      where: { id },
      data,
      include: {
        template: true,
      },
    });
  }

  async findById(id: string): Promise<EInvite | null> {
    return this.prisma.eInvite.findUnique({
      where: { id },
      include: {
        template: true,
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venueName: true,
            address: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findByEventId(eventId: string): Promise<EInvite | null> {
    return this.prisma.eInvite.findUnique({
      where: { eventId },
      include: {
        template: true,
      },
    });
  }

  async findByShareCode(shareCode: string): Promise<EInvite | null> {
    return this.prisma.eInvite.findUnique({
      where: { shareCode },
      include: {
        template: true,
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venueName: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.eInvite.delete({
      where: { id },
    });
  }

  // ============================================================================
  // E-INVITE SENT METHODS
  // ============================================================================

  async createSentRecord(data: Prisma.EInviteSentCreateInput): Promise<EInviteSent> {
    return this.prisma.eInviteSent.create({
      data,
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async upsertSentRecord(
    einviteId: string,
    guestId: string,
    channel: EInviteChannel,
    data: Partial<Prisma.EInviteSentCreateInput>,
  ): Promise<EInviteSent> {
    return this.prisma.eInviteSent.upsert({
      where: {
        einviteId_guestId_channel: {
          einviteId,
          guestId,
          channel,
        },
      },
      update: {
        status: data.status as EInviteSentStatus,
        sentAt: data.sentAt as Date,
        messageId: data.messageId as string,
        errorMessage: data.errorMessage as string,
      },
      create: {
        einvite: { connect: { id: einviteId } },
        guest: { connect: { id: guestId } },
        channel,
        status: (data.status as EInviteSentStatus) || 'PENDING',
        sentAt: data.sentAt as Date,
        messageId: data.messageId as string,
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async updateSentStatus(
    id: string,
    status: EInviteSentStatus,
    additionalData?: { deliveredAt?: Date; viewedAt?: Date; errorMessage?: string },
  ): Promise<EInviteSent> {
    return this.prisma.eInviteSent.update({
      where: { id },
      data: {
        status,
        ...additionalData,
      },
    });
  }

  async findSentByEInvite(einviteId: string): Promise<EInviteSent[]> {
    return this.prisma.eInviteSent.findMany({
      where: { einviteId },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSentByGuest(guestId: string): Promise<EInviteSent[]> {
    return this.prisma.eInviteSent.findMany({
      where: { guestId },
      include: {
        einvite: {
          select: {
            id: true,
            eventName: true,
            shareCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countSentByEInvite(einviteId: string): Promise<{ sent: number; viewed: number }> {
    const [sent, viewed] = await Promise.all([
      this.prisma.eInviteSent.count({
        where: {
          einviteId,
          status: { in: ['SENT', 'DELIVERED', 'VIEWED'] },
        },
      }),
      this.prisma.eInviteSent.count({
        where: {
          einviteId,
          status: 'VIEWED',
        },
      }),
    ]);
    return { sent, viewed };
  }

  async getGuestsNotSent(einviteId: string, guestlistId: string): Promise<string[]> {
    const sentGuestIds = await this.prisma.eInviteSent.findMany({
      where: { einviteId },
      select: { guestId: true },
    });

    const sentIds = new Set(sentGuestIds.map((s) => s.guestId));

    const allGuests = await this.prisma.guest.findMany({
      where: { guestlistId },
      select: { id: true },
    });

    return allGuests.filter((g) => !sentIds.has(g.id)).map((g) => g.id);
  }

  async markAsViewed(shareCode: string, guestId?: string): Promise<void> {
    const einvite = await this.findByShareCode(shareCode);
    if (!einvite) return;

    if (guestId) {
      await this.prisma.eInviteSent.updateMany({
        where: {
          einviteId: einvite.id,
          guestId,
          viewedAt: null,
        },
        data: {
          status: 'VIEWED',
          viewedAt: new Date(),
        },
      });
    }
  }
}
