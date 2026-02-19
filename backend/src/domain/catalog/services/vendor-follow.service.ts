// ============================================================================
// VENDOR FOLLOW SERVICE - Catalog Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class VendorFollowService {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.awardFollowerBadges(vendorProfileId);

    return { following: true };
  }

  async status(userId: string, vendorProfileId: string) {
    const existing = await this.prisma.vendorFollow.findUnique({
      where: { userId_vendorProfileId: { userId, vendorProfileId } },
    });

    return { following: Boolean(existing) };
  }

  private async awardFollowerBadges(vendorProfileId: string) {
    const followerCount = await this.prisma.vendorFollow.count({
      where: { vendorProfileId },
    });

    const definitions = await this.prisma.vendorBadgeDefinition.findMany({
      where: {
        metric: 'FOLLOWERS',
        isActive: true,
        threshold: { lte: followerCount },
      },
    });

    if (definitions.length === 0) return;

    const definitionIds = definitions.map((definition) => definition.id);
    const existing = await this.prisma.vendorBadge.findMany({
      where: {
        vendorProfileId,
        badgeDefinitionId: { in: definitionIds },
      },
      select: { badgeDefinitionId: true },
    });

    const existingIds = new Set(
      existing.map((badge) => badge.badgeDefinitionId),
    );
    const toCreate = definitionIds
      .filter((id) => !existingIds.has(id))
      .map((id) => ({ vendorProfileId, badgeDefinitionId: id }));

    if (toCreate.length === 0) return;

    await this.prisma.vendorBadge.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }
}
