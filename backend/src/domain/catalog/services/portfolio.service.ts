// ============================================================================
// PORTFOLIO SERVICE - Catalog Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Portfolio, Prisma } from '@prisma/client';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  SearchPortfolioMediaDto,
  PortfolioMediaItemResponseDto,
  UpdateMediaItemDto,
} from '../dto/portfolio.dto';
import { PrismaService } from '../../../core/database/prisma.service';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreatePortfolioDto): Promise<Portfolio> {
    this.logger.log(`Creating portfolio for vendor: ${dto.vendorProfileId}`);

    const portfolio = await this.portfolioRepository.create(
      {
        vendorProfile: { connect: { id: dto.vendorProfileId } },
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isFeatured: dto.isFeatured ?? false,
        mediaItems: dto.mediaItems
          ? {
              create: dto.mediaItems.map((item, index) => ({
                type: item.type,
                url: item.url,
                thumbnailUrl: item.thumbnailUrl,
                cdnUrl: item.cdnUrl,
                altText: item.altText,
                caption: item.caption,
                width: item.width,
                height: item.height,
                duration: item.duration,
                size: item.size,
                mimeType: item.mimeType,
                sortOrder: item.sortOrder ?? index,
                isApproved: item.isApproved ?? true,
              })),
            }
          : undefined,
      },
      {
        mediaItems: true,
      },
    );

    this.eventEmitter.emit('portfolio.created', {
      portfolioId: portfolio.id,
      vendorProfileId: dto.vendorProfileId,
    });
    return portfolio;
  }

  async findById(id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findById(id, {
      mediaItems: true,
    });
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    return portfolio;
  }

  async findByVendorProfile(vendorProfileId: string) {
    return this.portfolioRepository.findByVendorProfile(vendorProfileId);
  }

  async findFeatured(vendorProfileId: string) {
    return this.portfolioRepository.findFeatured(vendorProfileId);
  }

  async update(id: string, dto: UpdatePortfolioDto): Promise<Portfolio> {
    await this.findById(id);
    return this.portfolioRepository.update(
      id,
      {
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder,
        isFeatured: dto.isFeatured,
      },
      {
        mediaItems: true,
      },
    );
  }

  async updateMediaItem(mediaItemId: string, dto: UpdateMediaItemDto) {
    const item = await this.prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
    });

    if (!item) {
      throw new NotFoundException('Media item not found');
    }

    return this.prisma.mediaItem.update({
      where: { id: mediaItemId },
      data: {
        altText: dto.altText,
        caption: dto.caption,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.portfolioRepository.delete(id);
    this.eventEmitter.emit('portfolio.deleted', { portfolioId: id });
  }

  async addMediaItem(
    portfolioId: string,
    media: {
      type: string;
      url: string;
      size: number;
      mimeType: string;
      thumbnailUrl?: string;
      cdnUrl?: string;
      altText?: string;
      caption?: string;
      width?: number;
      height?: number;
      duration?: number;
      sortOrder?: number;
    },
  ) {
    await this.findById(portfolioId);

    const item = await this.prisma.mediaItem.create({
      data: {
        portfolio: { connect: { id: portfolioId } },
        type: media.type as any,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        cdnUrl: media.cdnUrl,
        altText: media.altText,
        caption: (media as any).caption,
        width: media.width,
        height: media.height,
        duration: media.duration,
        size: media.size,
        mimeType: media.mimeType,
        sortOrder: media.sortOrder ?? 0,
        isApproved: true,
      },
    });

    this.eventEmitter.emit('portfolio.media-added', {
      portfolioId,
      mediaItemId: item.id,
    });
    return item;
  }

  async deleteMediaItem(mediaItemId: string) {
    const item = await this.prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
    });

    if (!item) {
      throw new NotFoundException('Media item not found');
    }

    await this.prisma.mediaItem.delete({
      where: { id: mediaItemId },
    });

    this.eventEmitter.emit('portfolio.media-deleted', {
      portfolioId: item.portfolioId,
      mediaItemId,
    });
    return { success: true };
  }

  async reorderMediaItems(portfolioId: string, itemIds: string[]) {
    await this.findById(portfolioId);

    await this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.prisma.mediaItem.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findById(portfolioId);
  }

  /**
   * Get random media items using raw SQL for better performance
   */
  private async getRandomMediaItems(
    where: Prisma.MediaItemWhereInput,
    skip: number,
    take: number,
  ) {
    // Build WHERE clause conditions
    const conditions: string[] = ['mi."is_approved" = true', 'mi."type" = \'IMAGE\''];

    // Add vendor profile conditions if needed
    const vendorWhere = (where.portfolio as any)?.vendorProfile;
    if (vendorWhere) {
      conditions.push('vp."status" = \'ACTIVE\'');

      if (vendorWhere.categoryId) {
        conditions.push(`vp."category_id" = '${vendorWhere.categoryId}'`);
      }

      if (vendorWhere.serviceAreas?.some?.cityId) {
        const cityId = vendorWhere.serviceAreas.some.cityId;
        conditions.push(`EXISTS (SELECT 1 FROM "catalog"."service_areas" sa WHERE sa."vendor_profile_id" = vp."id" AND sa."city_id" = '${cityId}')`);
      }

      if (vendorWhere.OR) {
        const orConditions = vendorWhere.OR.map((or: any) => {
          if (or.businessName?.contains) {
            return `vp."business_name" ILIKE '%${or.businessName.contains}%'`;
          }
          if (or.tagline?.contains) {
            return `vp."tagline" ILIKE '%${or.tagline.contains}%'`;
          }
          if (or.description?.contains) {
            return `vp."description" ILIKE '%${or.description.contains}%'`;
          }
          return null;
        }).filter(Boolean);

        if (orConditions.length > 0) {
          conditions.push(`(${orConditions.join(' OR ')})`);
        }
      }
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT
        mi."id",
        mi."portfolio_id" as "portfolioId",
        mi."type",
        mi."url",
        mi."thumbnail_url" as "thumbnailUrl",
        mi."cdn_url" as "cdnUrl",
        mi."alt_text" as "altText",
        mi."caption",
        mi."width",
        mi."height",
        mi."created_at" as "createdAt",
        p."id" as "portfolio_id",
        vp."id" as "vendor_id",
        vp."slug" as "vendor_slug",
        vp."business_name" as "vendor_businessName",
        vp."category_id" as "vendor_categoryId",
        c."name" as "category_name"
      FROM "catalog"."media_items" mi
      INNER JOIN "catalog"."portfolios" p ON mi."portfolio_id" = p."id"
      INNER JOIN "catalog"."vendor_profiles" vp ON p."vendor_profile_id" = vp."id"
      LEFT JOIN "catalog"."categories" c ON vp."category_id" = c."id"
      WHERE ${whereClause}
      ORDER BY RANDOM()
      OFFSET ${skip}
      LIMIT ${take}
    `;

    const rawItems = await this.prisma.$queryRawUnsafe<any[]>(query);

    // Transform to expected format
    return rawItems.map((item) => ({
      id: item.id,
      portfolioId: item.portfolioId,
      type: item.type,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      cdnUrl: item.cdnUrl,
      altText: item.altText,
      caption: item.caption,
      width: item.width,
      height: item.height,
      createdAt: item.createdAt,
      portfolio: {
        id: item.portfolio_id,
        vendorProfile: {
          id: item.vendor_id,
          slug: item.vendor_slug,
          businessName: item.vendor_businessName,
          categoryId: item.vendor_categoryId,
          category: item.category_name ? {
            id: item.vendor_categoryId,
            name: item.category_name,
            slug: item.vendor_slug,
          } : null,
        },
      },
    }));
  }

  async getPublicMediaFeed(
    dto: SearchPortfolioMediaDto,
  ): Promise<PaginatedResult<PortfolioMediaItemResponseDto>> {
    const { query, categoryId, cityId, page = 1, limit = 24, orderBy = 'newest' } = dto;

    const vendorProfileWhere: Prisma.VendorProfileWhereInput = {
      status: { in: ['ACTIVE', 'UNCLAIMED'] },
    };

    if (categoryId) {
      vendorProfileWhere.categoryId = categoryId;
    }

    if (cityId) {
      vendorProfileWhere.serviceAreas = {
        some: { cityId },
      };
    }

    if (query) {
      vendorProfileWhere.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { tagline: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const where: Prisma.MediaItemWhereInput = {
      isApproved: true,
      type: 'IMAGE',
      portfolio: {
        vendorProfile: vendorProfileWhere,
      },
    };

    const skip = (page - 1) * limit;

    // Determine order based on orderBy parameter
    let orderByClause: Prisma.MediaItemOrderByWithRelationInput[] | undefined;
    let useRawQuery = false;

    switch (orderBy) {
      case 'random':
        useRawQuery = true;
        break;
      case 'oldest':
        orderByClause = [{ createdAt: 'asc' }];
        break;
      case 'newest':
      default:
        orderByClause = [{ createdAt: 'desc' }];
        break;
    }

    // Run queries in parallel without transaction to avoid timeout
    const [total, items] = await Promise.all([
      this.prisma.mediaItem.count({ where }),
      useRawQuery
        ? this.getRandomMediaItems(where, skip, limit)
        : this.prisma.mediaItem.findMany({
            where,
            include: {
              portfolio: {
                select: {
                  id: true,
                  vendorProfile: {
                    select: {
                      id: true,
                      slug: true,
                      businessName: true,
                      categoryId: true,
                      category: {
                        select: {
                          id: true,
                          name: true,
                          slug: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: orderByClause,
            skip,
            take: limit,
          }),
    ]);

    const data: PortfolioMediaItemResponseDto[] = items.map((item) => ({
      id: item.id,
      portfolioId: item.portfolioId,
      type: item.type as any,
      url: item.cdnUrl || item.url,
      thumbnailUrl: item.thumbnailUrl,
      cdnUrl: item.cdnUrl,
      altText: item.altText,
      caption: (item as any).caption,
      width: item.width,
      height: item.height,
      createdAt: item.createdAt,
      vendor: {
        id: item.portfolio.vendorProfile.id,
        slug: item.portfolio.vendorProfile.slug,
        businessName: item.portfolio.vendorProfile.businessName,
        categoryId: item.portfolio.vendorProfile.categoryId,
        categoryName: item.portfolio.vendorProfile.category?.name ?? null,
      },
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
