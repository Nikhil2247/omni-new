// ============================================================================
// WISHLIST SERVICE - Planning Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Wishlist } from '@prisma/client';
import { WishlistRepository } from '../repositories/wishlist.repository';
import { WishlistItemRepository } from '../repositories/wishlist-item.repository';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import { AddWishlistItemDto } from '../dto/wishlist.dto';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly wishlistItemRepository: WishlistItemRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateWishlistDto): Promise<Wishlist> {
    this.logger.log(`Creating wishlist for user: ${dto.userId}`);

    const wishlist = await this.wishlistRepository.create({
      userId: dto.userId,
      name: dto.name,
      description: dto.description,
      isDefault: dto.isDefault ?? false,
    });

    this.eventEmitter.emit('wishlist.created', {
      wishlistId: wishlist.id,
      userId: dto.userId,
    });
    return wishlist;
  }

  async findById(id: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    if (!wishlist.items.length) {
      return { ...wishlist, items: [] };
    }

    const wishlistItems = wishlist.items as Array<{
      id: string;
      wishlistId: string;
      vendorProfileId: string | null;
      mediaItemId: string | null;
      notes: string | null;
      createdAt: Date;
    }>;

    const vendorIds = wishlistItems
      .map((item) => item.vendorProfileId)
      .filter((vendorId): vendorId is string => Boolean(vendorId));

    const mediaItemIds = wishlistItems
      .map((item) => item.mediaItemId)
      .filter((mediaItemId): mediaItemId is string => Boolean(mediaItemId));

    const vendors = await this.prisma.vendorProfile.findMany({
      where: { id: { in: vendorIds } },
      select: {
        id: true,
        businessName: true,
        slug: true,
        tagline: true,
        categoryId: true,
      },
    });
    const vendorMap = new Map<
      string,
      {
        id: string;
        businessName: string;
        slug: string;
        categoryId: string;
        tagline: string | null;
      }
    >();
    for (const vendor of vendors as Array<{
      id: string;
      businessName: string;
      slug: string;
      categoryId: string;
      tagline: string | null;
    }>) {
      vendorMap.set(vendor.id, vendor);
    }

    const mediaItems = await this.prisma.mediaItem.findMany({
      where: { id: { in: mediaItemIds } },
      select: {
        id: true,
        type: true,
        url: true,
        thumbnailUrl: true,
        cdnUrl: true,
        altText: true,
        caption: true,
        createdAt: true,
        portfolio: {
          select: {
            vendorProfile: {
              select: {
                id: true,
                businessName: true,
                slug: true,
                categoryId: true,
                tagline: true,
              },
            },
          },
        },
      },
    });
    const mediaItemMap = new Map<
      string,
      {
        id: string;
        type: string;
        url: string;
        thumbnailUrl: string | null;
        cdnUrl: string | null;
        altText: string | null;
        caption: string | null;
        createdAt: Date;
        vendor: {
          id: string;
          businessName: string;
          slug: string;
          categoryId: string;
          tagline: string | null;
        };
      }
    >();
    for (const mediaItem of mediaItems as Array<{
      id: string;
      type: string;
      url: string;
      thumbnailUrl: string | null;
      cdnUrl: string | null;
      altText: string | null;
      caption: string | null;
      createdAt: Date;
      portfolio: {
        vendorProfile: {
          id: string;
          businessName: string;
          slug: string;
          categoryId: string;
          tagline: string | null;
        };
      };
    }>) {
      mediaItemMap.set(mediaItem.id, {
        id: mediaItem.id,
        type: mediaItem.type,
        url: mediaItem.url,
        thumbnailUrl: mediaItem.thumbnailUrl,
        cdnUrl: mediaItem.cdnUrl,
        altText: mediaItem.altText,
        caption: mediaItem.caption,
        createdAt: mediaItem.createdAt,
        vendor: mediaItem.portfolio.vendorProfile,
      });
    }

    return {
      ...wishlist,
      items: wishlistItems.map((item) => ({
        ...item,
        mediaItem:
          typeof item.mediaItemId === 'string'
            ? (mediaItemMap.get(item.mediaItemId) ?? null)
            : null,
        vendor: item.vendorProfileId
          ? (vendorMap.get(item.vendorProfileId) ?? null)
          : null,
      })),
    };
  }

  async findByUserId(userId: string) {
    const wishlists = await this.wishlistRepository.findByUserId(userId);

    if (!wishlists.length) {
      return [];
    }

    // Collect all vendor IDs across all wishlists
    const allVendorIds: string[] = [];
    for (const wishlist of wishlists) {
      const items = wishlist.items as Array<{
        vendorProfileId: string | null;
      }>;
      for (const item of items) {
        if (item.vendorProfileId) {
          allVendorIds.push(item.vendorProfileId);
        }
      }
    }

    // Fetch all vendor profiles at once
    const vendorMap = new Map<
      string,
      {
        id: string;
        businessName: string;
        slug: string;
        profilePhotoUrl: string | null;
        bannerImageUrl: string | null;
      }
    >();

    if (allVendorIds.length > 0) {
      const vendors = await this.prisma.vendorProfile.findMany({
        where: { id: { in: allVendorIds } },
        select: {
          id: true,
          businessName: true,
          slug: true,
          profilePhotoUrl: true,
          bannerImageUrl: true,
        },
      });
      for (const vendor of vendors) {
        vendorMap.set(vendor.id, vendor);
      }
    }

    // Enrich each wishlist's items with vendor data
    return wishlists.map((wishlist) => {
      const items = wishlist.items as Array<{
        id: string;
        wishlistId: string;
        vendorProfileId: string | null;
        mediaItemId: string | null;
        notes: string | null;
        createdAt: Date;
        mediaItem?: {
          id: string;
          type: string;
          url: string;
          cdnUrl: string | null;
          thumbnailUrl: string | null;
          altText: string | null;
          caption: string | null;
        } | null;
      }>;

      return {
        ...wishlist,
        items: items.map((item) => ({
          ...item,
          vendor: item.vendorProfileId
            ? (vendorMap.get(item.vendorProfileId) ?? null)
            : null,
        })),
      };
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.wishlistRepository.delete(id);
    this.eventEmitter.emit('wishlist.deleted', { wishlistId: id });
  }

  async addItem(wishlistId: string, dto: AddWishlistItemDto) {
    await this.findById(wishlistId);

    const { vendorProfileId, mediaItemId, notes } = dto;

    if (!vendorProfileId && !mediaItemId) {
      throw new BadRequestException(
        'Either vendorProfileId or mediaItemId is required',
      );
    }

    if (vendorProfileId && mediaItemId) {
      throw new BadRequestException(
        'Provide only one of vendorProfileId or mediaItemId',
      );
    }

    const item = await this.prisma.wishlistItem.create({
      data: {
        wishlistId,
        ...(vendorProfileId && { vendorProfileId }),
        ...(mediaItemId && { mediaItemId }),
        notes,
      },
    });

    if (vendorProfileId) {
      this.eventEmitter.emit('wishlist.vendor-added', {
        wishlistId,
        vendorProfileId,
      });
    }

    if (mediaItemId) {
      this.eventEmitter.emit('wishlist.media-added', {
        wishlistId,
        mediaItemId,
      });
    }

    return item;
  }

  async removeVendor(itemId: string): Promise<void> {
    await this.prisma.wishlistItem.delete({ where: { id: itemId } });
  }

  async markAsContacted(itemId: string): Promise<void> {
    await this.prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        notes: 'Contacted',
      },
    });
  }
}
