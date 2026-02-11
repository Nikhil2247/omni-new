// ============================================================================
// WISHLIST ITEM REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  WishlistItem,
  Prisma,
} from '@prisma/client'

@Injectable()
export class WishlistItemRepository extends BaseRepository<
  WishlistItem,
  Prisma.WishlistItemCreateInput,
  Prisma.WishlistItemUpdateInput,
  Prisma.WishlistItemWhereInput,
  Prisma.WishlistItemWhereUniqueInput,
  Prisma.WishlistItemOrderByWithRelationInput
> {
  protected readonly modelName = 'WishlistItem'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.wishlistItem
  }

  async findByWishlist(wishlistId: string) {
    return this.model.findMany({
      where: { wishlistId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByVendorProfile(wishlistId: string, vendorProfileId: string) {
    return this.model.findMany({
      where: {
        wishlistId,
        vendorProfileId,
      },
    })
  }
}
