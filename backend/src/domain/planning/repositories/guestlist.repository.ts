// ============================================================================
// GUESTLIST REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, Guestlist, Guest } from '@prisma/client';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class GuestlistRepository extends BaseRepository<
  Guestlist,
  Prisma.GuestlistCreateInput,
  Prisma.GuestlistUpdateInput,
  Prisma.GuestlistWhereInput,
  Prisma.GuestlistWhereUniqueInput,
  Prisma.GuestlistOrderByWithRelationInput
> {
  protected readonly modelName = 'Guestlist';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.guestlist;
  }

  async findByEventId(eventId: string): Promise<Guestlist | null> {
    return this.prisma.guestlist.findUnique({
      where: { eventId },
      include: {
        guests: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getStats(guestlistId: string) {
    const stats = await this.prisma.guest.groupBy({
      by: ['rsvpStatus'],
      where: { guestlistId },
      _count: true,
      _sum: { plusOne: true },
    });

    const totalInvited = stats.reduce((sum, stat) => sum + stat._count, 0);
    const confirmed =
      stats.find((s) => s.rsvpStatus === 'ATTENDING')?._count || 0;
    const declined =
      stats.find((s) => s.rsvpStatus === 'NOT_ATTENDING')?._count || 0;
    const pending = stats.find((s) => s.rsvpStatus === 'PENDING')?._count || 0;
    const totalPlusOnes = stats.reduce(
      (sum, stat) => sum + (stat._sum.plusOne || 0),
      0,
    );

    return {
      totalInvited,
      confirmed,
      declined,
      pending,
      totalExpected: confirmed + totalPlusOnes,
    };
  }

  async addGuest(
    guestlistId: string,
    data: Prisma.GuestCreateInput,
  ): Promise<Guest> {
    return this.prisma.guest.create({ data });
  }

  async updateGuest(
    guestId: string,
    data: Prisma.GuestUpdateInput,
  ): Promise<Guest> {
    return this.prisma.guest.update({
      where: { id: guestId },
      data,
    });
  }

  async deleteGuest(guestId: string): Promise<void> {
    await this.prisma.guest.delete({ where: { id: guestId } });
  }

  async findGuestById(guestId: string): Promise<Guest | null> {
    return this.prisma.guest.findUnique({ where: { id: guestId } });
  }
}
