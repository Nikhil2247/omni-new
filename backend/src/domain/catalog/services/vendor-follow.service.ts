// ============================================================================
// VENDOR FOLLOW SERVICE - Catalog Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { VendorBadgeService } from './vendor-badge.service';

@Injectable()
export class VendorFollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badgeService: VendorBadgeService,
  ) {}

  async toggle(userId: string, vendorProfileId: string) {
    const existing = await this.prisma.vendorFollow.findUnique({
      where: { userId_vendorProfileId: { userId, vendorProfileId } },
    });

    if (existing) {
      await this.prisma.vendorFollow.delete({
        where: { userId_vendorProfileId: { userId, vendorProfileId } },
      });
      return { following: false };
    }

    await this.prisma.vendorFollow.create({
      data: {
        user: { connect: { id: userId } },
        vendor: { connect: { id: vendorProfileId } },
      },
    });

    // Award badges for reaching follower milestones
    await this.badgeService.awardFollowerBadges(vendorProfileId);

    return { following: true };
  }

  async status(userId: string, vendorProfileId: string) {
    const existing = await this.prisma.vendorFollow.findUnique({
      where: { userId_vendorProfileId: { userId, vendorProfileId } },
    });

    return { following: Boolean(existing) };
  }

  /**
   * Follow a vendor without toggling (used for auto-follow)
   */
  async follow(userId: string, vendorProfileId: string): Promise<boolean> {
    const existing = await this.prisma.vendorFollow.findUnique({
      where: { userId_vendorProfileId: { userId, vendorProfileId } },
    });

    if (existing) {
      return false; // Already following
    }

    await this.prisma.vendorFollow.create({
      data: {
        user: { connect: { id: userId } },
        vendor: { connect: { id: vendorProfileId } },
      },
    });

    // Award badges for reaching follower milestones
    await this.badgeService.awardFollowerBadges(vendorProfileId);

    return true;
  }
}
