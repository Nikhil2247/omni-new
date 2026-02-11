// ============================================================================
// WISHLIST SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Wishlist } from '@prisma/client'
import { WishlistRepository } from '../repositories/wishlist.repository'
import { WishlistItemRepository } from '../repositories/wishlist-item.repository'
import { CreateWishlistDto } from '../dto/create-wishlist.dto'
import { PrismaService } from '../../../core/database/prisma.service'

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name)

  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly wishlistItemRepository: WishlistItemRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateWishlistDto): Promise<Wishlist> {
    this.logger.log(`Creating wishlist for user: ${dto.userId}`)

    const wishlist = await this.wishlistRepository.create({
      userId: dto.userId,
      name: dto.name,
      description: dto.description,
      isDefault: dto.isDefault ?? false,
    })

    this.eventEmitter.emit('wishlist.created', { wishlistId: wishlist.id, userId: dto.userId })
    return wishlist
  }

  async findById(id: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found')
    }

    // Enrich items with vendor profile details
    if (wishlist.items && wishlist.items.length > 0) {
      const vendorIds = wishlist.items.map((item) => item.vendorProfileId)
      const vendors = await this.prisma.vendorProfile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          slug: true,
          categoryId: true,
          tagline: true,
        },
      })

      const vendorMap = new Map(vendors.map((v) => [v.id, v]))

      return {
        ...wishlist,
        items: wishlist.items.map((item) => ({
          ...item,
          vendor: vendorMap.get(item.vendorProfileId) || null,
        })),
      }
    }

    return wishlist
  }

  async findByUserId(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.findByUserId(userId)
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.wishlistRepository.delete(id)
    this.eventEmitter.emit('wishlist.deleted', { wishlistId: id })
  }

  async addVendor(wishlistId: string, vendorProfileId: string, notes?: string) {
    await this.findById(wishlistId)

    const item = await this.prisma.wishlistItem.create({
      data: {
        wishlist: { connect: { id: wishlistId } },
        vendorProfileId,
        notes,
      },
    })

    this.eventEmitter.emit('wishlist.vendor-added', { wishlistId, vendorProfileId })
    return item
  }

  async removeVendor(itemId: string): Promise<void> {
    await this.prisma.wishlistItem.delete({ where: { id: itemId } })
  }

  async markAsContacted(itemId: string): Promise<void> {
    await this.prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        notes: 'Contacted',
      },
    })
  }
}
