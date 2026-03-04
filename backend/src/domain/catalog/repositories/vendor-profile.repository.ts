// ============================================================================
// VENDOR PROFILE REPOSITORY - Data Access Layer for Vendor Profiles
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, VendorProfile } from '@prisma/client';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';
import { SearchVendorProfileDto } from '../dto/vendor-profile.dto';

@Injectable()
export class VendorProfileRepository extends BaseRepository<
  VendorProfile,
  Prisma.VendorProfileCreateInput,
  Prisma.VendorProfileUpdateInput,
  Prisma.VendorProfileWhereInput,
  Prisma.VendorProfileWhereUniqueInput,
  Prisma.VendorProfileOrderByWithRelationInput
> {
  protected readonly modelName = 'VendorProfile';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.vendorProfile;
  }

  /**
   * Find vendor profile by user ID
   */
  async findByUserId(
    userId: string,
    include?: Prisma.VendorProfileInclude,
  ): Promise<VendorProfile | null> {
    this.logger.debug(`Finding vendor profile by user ID: ${userId}`);

    return this.prisma.vendorProfile.findUnique({
      where: { userId },
      include,
    });
  }

  /**
   * Find vendor profile by slug
   */
  async findBySlug(
    slug: string,
    include?: Prisma.VendorProfileInclude,
  ): Promise<VendorProfile | null> {
    this.logger.debug(`Finding vendor profile by slug: ${slug}`);

    return this.prisma.vendorProfile.findUnique({
      where: { slug },
      include,
    });
  }

  /**
   * Search vendor profiles with filters and pagination
   */
  async search(
    searchDto: SearchVendorProfileDto,
    userId?: string,
  ): Promise<PaginatedResult<VendorProfile>> {
    this.logger.debug('Searching vendor profiles', searchDto);

    const {
      query,
      categoryId,
      cityId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    // Build where clause
    const where: Prisma.VendorProfileWhereInput = {
      status: 'ACTIVE', // Only show active vendors publicly
    };

    // Text search across multiple fields
    if (query) {
      where.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { tagline: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filter by category (supports both UUID and slug)
    if (categoryId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(categoryId);

      if (isUuid) {
        where.categoryId = categoryId;
      } else {
        // It's a slug, so filter by category.slug
        where.category = { slug: categoryId };
      }
    }

    // Filter by service area (city)
    if (cityId) {
      where.serviceAreas = {
        some: {
          cityId,
        },
      };
    }

    // Build order by
    const orderBy: Prisma.VendorProfileOrderByWithRelationInput = {};
    if (sortBy === 'leadCount') {
      orderBy.leadCount = sortOrder;
    } else if (sortBy === 'viewCount') {
      orderBy.viewCount = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Include related data (optimized to prevent N+1 queries)
    const include: Prisma.VendorProfileInclude = {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
      address: {
        select: {
          id: true,
          addressLine1: true,
          addressLine2: true,
          postalCode: true,
          latitude: true,
          longitude: true,
          city: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      serviceAreas: {
        take: 5,
        select: {
          id: true,
          cityId: true,
        },
      },
      services: {
        take: 10,
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          startingPrice: true,
          pricingType: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      portfolios: {
        take: 5,
        select: {
          id: true,
          title: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    };

    // If userId is provided, include follow status
    if (userId) {
      include.followers = {
        where: { userId },
        select: { userId: true },
      };
    }

    const result = await this.findManyPaginated(
      { page, limit, sortBy, sortOrder },
      { where, orderBy, include },
    );

    // Transform the result to include isFollowing flag
    if (userId) {
      result.data = result.data.map((vendor: any) => ({
        ...vendor,
        isFollowing: vendor.followers && vendor.followers.length > 0,
        followers: undefined, // Remove the followers array from response
      }));
    }

    return result;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    this.logger.debug(`Incrementing view count for vendor profile: ${id}`);

    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  /**
   * Increment lead count
   */
  async incrementLeadCount(id: string): Promise<void> {
    this.logger.debug(`Incrementing lead count for vendor profile: ${id}`);

    await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        leadCount: { increment: 1 },
      },
    });
  }

  /**
   * Find featured vendors (based on featuredUntil date)
   */
  async findFeatured(limit: number = 10): Promise<VendorProfile[]> {
    this.logger.debug('Finding featured vendor profiles');

    return this.prisma.vendorProfile.findMany({
      where: {
        status: 'ACTIVE',
        featuredUntil: {
          gte: new Date(), // Featured until date is in the future
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        address: {
          select: {
            id: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        services: {
          take: 5,
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            startingPrice: true,
            pricingType: true,
          },
        },
        portfolios: {
          take: 3,
          select: {
            id: true,
            title: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Find vendors by category ID
   */
  async findByCategory(
    categoryId: string,
    limit: number = 20,
  ): Promise<VendorProfile[]> {
    this.logger.debug(`Finding vendors by category ID: ${categoryId}`);

    return this.prisma.vendorProfile.findMany({
      where: {
        categoryId,
        status: 'ACTIVE',
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
      include: {
        category: true,
        address: true,
      },
    });
  }

  /**
   * Find vendors by category slug
   */
  async findByCategorySlug(
    categorySlug: string,
    limit: number = 20,
  ): Promise<VendorProfile[]> {
    this.logger.debug(`Finding vendors by category slug: ${categorySlug}`);

    return this.prisma.vendorProfile.findMany({
      where: {
        category: {
          slug: categorySlug,
        },
        status: 'ACTIVE',
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
      include: {
        category: true,
        address: true,
      },
    });
  }

  /**
   * Find vendors by category (accepts both ID and slug)
   */
  async findByCategoryIdOrSlug(
    categoryIdOrSlug: string,
    limit: number = 20,
  ): Promise<VendorProfile[]> {
    this.logger.debug(
      `Finding vendors by category ID or slug: ${categoryIdOrSlug}`,
    );

    // Check if the input looks like a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(categoryIdOrSlug);

    if (isUuid) {
      return this.findByCategory(categoryIdOrSlug, limit);
    } else {
      return this.findByCategorySlug(categoryIdOrSlug, limit);
    }
  }

  /**
   * Find vendors by service area (city)
   */
  async findByCity(
    cityId: string,
    limit: number = 20,
  ): Promise<VendorProfile[]> {
    this.logger.debug(`Finding vendors by city: ${cityId}`);

    return this.prisma.vendorProfile.findMany({
      where: {
        serviceAreas: {
          some: {
            cityId,
          },
        },
        status: 'ACTIVE',
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        address: {
          select: {
            id: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceAreas: {
          where: {
            cityId,
          },
          select: {
            id: true,
            cityId: true,
          },
        },
        services: {
          take: 5,
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            startingPrice: true,
            pricingType: true,
          },
        },
        portfolios: {
          take: 3,
          select: {
            id: true,
            title: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
