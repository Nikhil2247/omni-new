// ============================================================================
// GUEST REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { Guest, Prisma, RSVPStatus } from '@prisma/client';

@Injectable()
export class GuestRepository extends BaseRepository<
  Guest,
  Prisma.GuestCreateInput,
  Prisma.GuestUpdateInput,
  Prisma.GuestWhereInput,
  Prisma.GuestWhereUniqueInput,
  Prisma.GuestOrderByWithRelationInput
> {
  protected readonly modelName = 'Guest';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.guest;
  }

  async findByGuestlist(guestlistId: string) {
    return this.model.findMany({
      where: { guestlistId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByRSVPStatus(guestlistId: string, rsvpStatus: RSVPStatus) {
    return this.model.findMany({
      where: {
        guestlistId,
        rsvpStatus,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getRSVPStats(guestlistId: string) {
    const totalInvited = await this.model.count({
      where: { guestlistId },
    });

    const confirmed = await this.model.count({
      where: {
        guestlistId,
        rsvpStatus: 'ATTENDING',
      },
    });

    const declined = await this.model.count({
      where: {
        guestlistId,
        rsvpStatus: 'NOT_ATTENDING',
      },
    });

    const pending = await this.model.count({
      where: {
        guestlistId,
        rsvpStatus: 'PENDING',
      },
    });

    const guestsWithPlusOnes = await this.model.aggregate({
      where: {
        guestlistId,
        rsvpStatus: 'ATTENDING',
      },
      _sum: {
        plusOne: true,
      },
    });

    const totalExpected =
      confirmed + Number(guestsWithPlusOnes._sum.plusOne || 0);

    return {
      totalInvited,
      confirmed,
      declined,
      pending,
      totalExpected,
    };
  }

  async searchGuests(guestlistId: string, searchTerm: string) {
    return this.model.findMany({
      where: {
        guestlistId,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { firstName: 'asc' },
    });
  }
}
