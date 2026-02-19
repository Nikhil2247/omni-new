// ============================================================================
// WISHLIST REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, Wishlist } from '@prisma/client';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class WishlistRepository extends BaseRepository<
  Wishlist,
  Prisma.WishlistCreateInput,
  Prisma.WishlistUpdateInput,
  Prisma.WishlistWhereInput,
  Prisma.WishlistWhereUniqueInput,
  Prisma.WishlistOrderByWithRelationInput
> {
  protected readonly modelName = 'Wishlist';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.wishlist;
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
