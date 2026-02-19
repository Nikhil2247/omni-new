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

  async getPublicMediaFeed(
    dto: SearchPortfolioMediaDto,
  ): Promise<PaginatedResult<PortfolioMediaItemResponseDto>> {
    const { query, categoryId, cityId, page = 1, limit = 24 } = dto;

    const vendorProfileWhere: Prisma.VendorProfileWhereInput = {
      status: 'ACTIVE',
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

    // Run queries in parallel without transaction to avoid timeout
    const [total, items] = await Promise.all([
      this.prisma.mediaItem.count({ where }),
      this.prisma.mediaItem.findMany({
        where,
        include: {
          portfolio: {
            include: {
              vendorProfile: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
