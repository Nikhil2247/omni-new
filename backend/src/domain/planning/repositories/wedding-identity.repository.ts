// ============================================================================
// WEDDING IDENTITY REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { Prisma, WeddingIdentity, WeddingPartner } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma.service'

type WeddingIdentityWithPartners = WeddingIdentity & { partners: WeddingPartner[] }

@Injectable()
export class WeddingIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // WEDDING IDENTITY
  // ============================================================================

  async findByUserId(userId: string): Promise<WeddingIdentityWithPartners | null> {
    // Find wedding identity where user is a partner (owner or accepted)
    const partner = await this.prisma.weddingPartner.findFirst({
      where: {
        userId,
        inviteStatus: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: {
        weddingIdentity: {
          include: {
            partners: {
              orderBy: { isOwner: 'desc' },
            },
          },
        },
      },
    })

    return partner?.weddingIdentity || null
  }

  async findById(id: string): Promise<WeddingIdentityWithPartners | null> {
    return this.prisma.weddingIdentity.findUnique({
      where: { id },
      include: {
        partners: {
          orderBy: { isOwner: 'desc' },
        },
      },
    })
  }

  async create(data: {
    displayName: string
    eventDate?: Date
    eventType?: 'WEDDING' | 'ENGAGEMENT' | 'OTHER'
    ownerUserId: string
    ownerName: string
    partnerName: string
  }): Promise<WeddingIdentityWithPartners> {
    return this.prisma.weddingIdentity.create({
      data: {
        displayName: data.displayName,
        eventDate: data.eventDate,
        eventType: data.eventType || 'WEDDING',
        partners: {
          create: [
            {
              userId: data.ownerUserId,
              name: data.ownerName,
              isOwner: true,
              inviteStatus: 'ACCEPTED',
              acceptedAt: new Date(),
            },
            {
              name: data.partnerName,
              isOwner: false,
              inviteStatus: 'PENDING',
            },
          ],
        },
      },
      include: {
        partners: {
          orderBy: { isOwner: 'desc' },
        },
      },
    })
  }

  async update(id: string, data: Prisma.WeddingIdentityUpdateInput): Promise<WeddingIdentityWithPartners> {
    return this.prisma.weddingIdentity.update({
      where: { id },
      data,
      include: {
        partners: {
          orderBy: { isOwner: 'desc' },
        },
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.weddingIdentity.delete({ where: { id } })
  }

  // ============================================================================
  // PARTNERS
  // ============================================================================

  async findPartnerByInviteToken(token: string): Promise<(WeddingPartner & { weddingIdentity: WeddingIdentity }) | null> {
    return this.prisma.weddingPartner.findUnique({
      where: { inviteToken: token },
      include: { weddingIdentity: true },
    })
  }

  async findPartnerByUserId(weddingIdentityId: string, userId: string): Promise<WeddingPartner | null> {
    return this.prisma.weddingPartner.findFirst({
      where: { weddingIdentityId, userId },
    })
  }

  async updatePartner(id: string, data: Prisma.WeddingPartnerUpdateInput): Promise<WeddingPartner> {
    return this.prisma.weddingPartner.update({
      where: { id },
      data,
    })
  }

  async createPartnerInvite(
    weddingIdentityId: string,
    data: { name: string; email: string; phone?: string; inviteToken: string },
  ): Promise<WeddingPartner> {
    // First, check if there's already a pending partner (non-owner)
    const existingPartner = await this.prisma.weddingPartner.findFirst({
      where: {
        weddingIdentityId,
        isOwner: false,
      },
    })

    if (existingPartner) {
      // Update existing partner with new invite details
      return this.prisma.weddingPartner.update({
        where: { id: existingPartner.id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          inviteToken: data.inviteToken,
          inviteStatus: 'PENDING',
          invitedAt: new Date(),
          userId: null,
          acceptedAt: null,
        },
      })
    }

    // Create new partner
    return this.prisma.weddingPartner.create({
      data: {
        weddingIdentityId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        inviteToken: data.inviteToken,
        isOwner: false,
        inviteStatus: 'PENDING',
        invitedAt: new Date(),
      },
    })
  }

  async acceptInvite(partnerId: string, userId: string): Promise<WeddingPartner> {
    return this.prisma.weddingPartner.update({
      where: { id: partnerId },
      data: {
        userId,
        inviteStatus: 'ACCEPTED',
        acceptedAt: new Date(),
        inviteToken: null, // Clear the token after acceptance
      },
    })
  }
}
