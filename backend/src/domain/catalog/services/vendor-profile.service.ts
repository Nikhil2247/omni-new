// ============================================================================
// VENDOR PROFILE SERVICE - Business Logic for Vendor Profiles
// ============================================================================

import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { VendorProfileRepository } from '../repositories/vendor-profile.repository'
import { CreateVendorProfileDto, UpdateVendorProfileDto, SearchVendorProfileDto, VendorProfileResponseDto } from '../dto/vendor-profile.dto'
import { PaginatedResult } from '../../../core/database/repositories/base.repository'
import { VendorProfile } from '@prisma/client'
import slugify from 'slugify'
import { CacheAsideStrategy } from '../../../infrastructure/cache/strategies/cache-aside.strategy'
import { VENDOR_EVENTS } from '../../../core/events/event-constants'
import { UploadService, FileCategory } from '../../../infrastructure/storage/upload.service'
import { PrismaService } from '../../../core/database/prisma.service'

@Injectable()
export class VendorProfileService {
  private readonly logger = new Logger(VendorProfileService.name)
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  constructor(
    private readonly vendorProfileRepository: VendorProfileRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheAside: CacheAsideStrategy,
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveCategoryId(input?: string): Promise<string> {
    const candidate = input?.trim()

    if (candidate && this.uuidRegex.test(candidate)) {
      const existingById = await this.prisma.category.findUnique({
        where: { id: candidate },
        select: { id: true },
      })

      if (!existingById) {
        throw new BadRequestException('Invalid categoryId')
      }

      return existingById.id
    }

    if (candidate?.startsWith('cat-')) {
      const rawIndex = Number(candidate.replace('cat-', ''))
      if (Number.isInteger(rawIndex) && rawIndex > 0) {
        const categories = await this.prisma.category.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true },
        })
        const fallback = categories[rawIndex - 1]
        if (fallback) {
          return fallback.id
        }
      }
    }

    if (candidate) {
      const bySlugOrName = await this.prisma.category.findFirst({
        where: {
          OR: [
            { slug: candidate.toLowerCase() },
            { name: { equals: candidate, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: { id: true },
      })

      if (bySlugOrName) {
        return bySlugOrName.id
      }
    }

    const defaultCategory = await this.prisma.category.findFirst({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true },
    })

    if (!defaultCategory) {
      throw new BadRequestException('No active category found. Please contact support.')
    }

    return defaultCategory.id
  }

  private async attachReviewMetrics<T extends { id: string }>(vendors: T[]): Promise<Array<T & { reviewsCount: number; averageRating: number | null }>> {
    if (vendors.length === 0) {
      return []
    }

    const vendorIds = vendors.map((vendor) => vendor.id)

    const reviewGroups = await this.prisma.vendorReview.groupBy({
      by: ['vendorProfileId'],
      where: {
        vendorProfileId: { in: vendorIds },
        status: 'APPROVED',
      },
      _count: { _all: true },
      _avg: { rating: true },
    })

    const metricsMap = new Map(
      reviewGroups.map((group) => [
        group.vendorProfileId,
        {
          reviewsCount: group._count._all,
          averageRating: group._avg.rating,
        },
      ]),
    )

    return vendors.map((vendor) => {
      const metrics = metricsMap.get(vendor.id)
      return {
        ...vendor,
        reviewsCount: metrics?.reviewsCount ?? 0,
        averageRating: metrics?.averageRating ?? null,
      }
    })
  }

  private async getEventHistory(vendorProfileId: string) {
    const eventHistoryRows = await this.prisma.eventVendor.findMany({
      where: { vendorProfileId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        event: {
          include: {
            eventType: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    return eventHistoryRows.map((row) => ({
      id: row.id,
      status: row.status,
      notes: row.notes,
      contractAmount: row.contractAmount,
      depositPaid: row.depositPaid,
      createdAt: row.createdAt,
      event: {
        id: row.event.id,
        name: row.event.name,
        date: row.event.date,
        endDate: row.event.endDate,
        venueName: row.event.venueName,
        guestCount: row.event.guestCount,
        description: row.event.description,
        status: row.event.status,
        eventType: row.event.eventType,
      },
    }))
  }

  private async enrichVendorProfile<T extends { id: string }>(vendorProfile: T) {
    const followersCount = (vendorProfile as any)?._count?.followers ?? 0
    const reviewsCount = (vendorProfile as any)?._count?.reviews ?? 0

    const [ratingAggregate, eventHistory] = await Promise.all([
      this.prisma.vendorReview.aggregate({
        where: {
          vendorProfileId: vendorProfile.id,
          status: 'APPROVED',
        },
        _avg: {
          rating: true,
        },
      }),
      this.getEventHistory(vendorProfile.id),
    ])

    return {
      ...(vendorProfile as any),
      followersCount,
      reviewsCount,
      averageRating: ratingAggregate._avg.rating ?? null,
      eventHistory,
    }
  }

  /**
   * Create vendor profile
   */
  async create(dto: CreateVendorProfileDto): Promise<VendorProfile> {
    this.logger.log(`Creating vendor profile for user: ${dto.userId}`)

    if (!dto.userId || !this.uuidRegex.test(dto.userId)) {
      throw new BadRequestException('Invalid user context')
    }

    // Check if user already has a vendor profile
    const existingProfile = await this.vendorProfileRepository.findByUserId(dto.userId)
    if (existingProfile) {
      throw new ConflictException('User already has a vendor profile')
    }

    const baseSlug = dto.slug?.trim() || dto.businessName
    const resolvedSlug = await this.generateSlug(baseSlug)
    const resolvedCategoryId = await this.resolveCategoryId(dto.categoryId)

    // Create vendor profile
    const vendorProfile = await this.vendorProfileRepository.create({
      user: { connect: { id: dto.userId } },
      businessName: dto.businessName,
      slug: resolvedSlug,
      category: { connect: { id: resolvedCategoryId } },
      description: dto.description,
      tagline: dto.tagline,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      website: dto.website,
      serviceRadius: dto.serviceRadius,
      address: dto.addressId ? { connect: { id: dto.addressId } } : undefined,
      status: 'DRAFT',
      // Create service areas if provided
      serviceAreas: dto.serviceAreaCityIds && dto.serviceAreaCityIds.length > 0 ? {
        create: dto.serviceAreaCityIds.map(cityId => ({
          cityId,
        })),
      } : undefined,
    }, {
      category: true,
      address: true,
      serviceAreas: true,
    })

    // Emit event
    this.eventEmitter.emit(VENDOR_EVENTS.CREATED, {
      vendorProfileId: vendorProfile.id,
      userId: dto.userId,
      businessName: dto.businessName,
    })

    this.logger.log(`Vendor profile created: ${vendorProfile.id}`)
    return vendorProfile
  }

  /**
   * Find vendor profile by ID
   */
  async findById(id: string, includeRelations: boolean = true): Promise<VendorProfile> {
    this.logger.debug(`Finding vendor profile by ID: ${id}`)

    const include = includeRelations ? {
      category: true,
      address: true,
      services: true,
      portfolios: true,
      serviceAreas: {
        take: 10,
      },
    } : undefined

    const vendorProfile = await this.vendorProfileRepository.findById(id, include)

    if (!vendorProfile) {
      throw new NotFoundException(`Vendor profile not found`)
    }

    return vendorProfile
  }

  /**
   * Submit vendor profile for verification
   */
  async submitForVerification(id: string): Promise<VendorProfile> {
    this.logger.log(`Submitting vendor profile for verification: ${id}`)
    
    const vendorProfile = await this.vendorProfileRepository.update(id, {
      status: 'PENDING_REVIEW',
    })

    this.eventEmitter.emit(VENDOR_EVENTS.VERIFICATION_REQUESTED, {
      vendorProfileId: id,
    })

    return vendorProfile
  }

  /**
   * Find vendor profile by slug
   */
  async findBySlug(slug: string): Promise<VendorProfile> {
    this.logger.debug(`Finding vendor profile by slug: ${slug}`)

    const vendorProfile = await this.cacheAside.get(
      `vendor:slug:v2:${slug}`,
      () =>
        this.vendorProfileRepository.findBySlug(slug, {
          category: true,
          address: true,
          services: true,
          badges: {
            include: {
              definition: true,
            },
            orderBy: {
              achievedAt: 'desc',
            },
          },
          _count: {
            select: {
              followers: true,
              reviews: true,
            },
          },
          portfolios: {
            take: 12,
            orderBy: { createdAt: 'desc' },
            include: {
              mediaItems: {
                where: { isApproved: true },
                orderBy: { sortOrder: 'asc' },
                take: 20,
              },
            },
          },
          serviceAreas: true,
        }),
      { ttl: 900 },
    )

    if (!vendorProfile) {
      throw new NotFoundException(`Vendor profile not found`)
    }

    // Increment view count asynchronously
    this.vendorProfileRepository.incrementViewCount(vendorProfile.id).catch(err => {
      this.logger.error(`Failed to increment view count: ${err.message}`)
    })

    return this.enrichVendorProfile(vendorProfile as any) as any
  }

  /**
   * Find vendor profile by user ID
   */
  async findByUserId(userId: string): Promise<VendorProfile> {
    this.logger.debug(`Finding vendor profile by user ID: ${userId}`)

    const vendorProfile = await this.vendorProfileRepository.findByUserId(userId, {
      category: true,
      address: true,
      services: true,
      badges: {
        include: {
          definition: true,
        },
        orderBy: {
          achievedAt: 'desc',
        },
      },
      _count: {
        select: {
          followers: true,
          reviews: true,
        },
      },
      portfolios: {
        orderBy: { createdAt: 'desc' },
        include: {
          mediaItems: {
            orderBy: { sortOrder: 'asc' },
            take: 20,
          },
        },
      },
      serviceAreas: true,
    })

    if (!vendorProfile) {
      throw new NotFoundException(`Vendor profile not found for user`)
    }

    return (await this.enrichVendorProfile(vendorProfile as any)) as any
  }

  /**
   * Update vendor profile
   */
  async update(id: string, dto: UpdateVendorProfileDto): Promise<VendorProfile> {
    this.logger.log(`Updating vendor profile: ${id}`)

    // Check if profile exists
    await this.findById(id, false)

    // If slug is being updated, check for conflicts
    if (dto.slug) {
      const existingSlug = await this.vendorProfileRepository.findBySlug(dto.slug)
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(`Slug '${dto.slug}' is already taken`)
      }
    }

    // Build update data
    const updateData: any = {
      businessName: dto.businessName,
      slug: dto.slug,
      tagline: dto.tagline,
      description: dto.description,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      website: dto.website,
      serviceRadius: dto.serviceRadius,
      status: dto.status,
    }

    if (dto.categoryId) {
      const resolvedCategoryId = await this.resolveCategoryId(dto.categoryId)
      updateData.category = { connect: { id: resolvedCategoryId } }
    }

    if (dto.addressId) {
      updateData.address = { connect: { id: dto.addressId } }
    }

    const vendorProfile = await this.vendorProfileRepository.update(id, updateData, {
      category: true,
      address: true,
      serviceAreas: true,
    })

    // Emit event
    this.eventEmitter.emit(VENDOR_EVENTS.UPDATED, {
      vendorProfileId: id,
      changes: dto,
    })

    this.logger.log(`Vendor profile updated: ${id}`)
    return vendorProfile
  }

  /**
   * Delete vendor profile (soft delete - handled by repository)
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting vendor profile: ${id}`)

    await this.findById(id, false)
    await this.vendorProfileRepository.delete(id)

    // Emit event
    this.eventEmitter.emit(VENDOR_EVENTS.DELETED, { vendorProfileId: id })

    this.logger.log(`Vendor profile deleted: ${id}`)
  }

  /**
   * Search vendor profiles
   */
  async search(searchDto: SearchVendorProfileDto, userId?: string): Promise<PaginatedResult<VendorProfile>> {
    this.logger.debug('Searching vendor profiles', searchDto)
    const result = await this.vendorProfileRepository.search(searchDto, userId)
    const withMetrics = await this.attachReviewMetrics(result.data as Array<{ id: string }>)
    return {
      ...result,
      data: withMetrics as unknown as VendorProfile[],
    }
  }

  /**
   * Get featured vendors
   */
  async getFeatured(limit: number = 10): Promise<VendorProfile[]> {
    this.logger.debug(`Getting featured vendors (limit: ${limit})`)
    const vendors = await this.cacheAside.get(
      `discovery:featured:${limit}`,
      () => this.vendorProfileRepository.findFeatured(limit),
      { ttl: 900 },
    )
    const withMetrics = await this.attachReviewMetrics(vendors as Array<{ id: string }>)
    return withMetrics as unknown as VendorProfile[]
  }

  /**
   * Get vendors by category
   */
  async getByCategory(categoryIdOrSlug: string, limit: number = 20): Promise<VendorProfile[]> {
    this.logger.debug(`Getting vendors by category: ${categoryIdOrSlug}`)
    const vendors = await this.cacheAside.get(
      `discovery:category:${categoryIdOrSlug}:limit:${limit}`,
      () => this.vendorProfileRepository.findByCategoryIdOrSlug(categoryIdOrSlug, limit),
      { ttl: 900 },
    )
    const withMetrics = await this.attachReviewMetrics(vendors as Array<{ id: string }>)
    return withMetrics as unknown as VendorProfile[]
  }

  /**
   * Get vendors by city
   */
  async getByCity(cityId: string, limit: number = 20): Promise<VendorProfile[]> {
    this.logger.debug(`Getting vendors by city: ${cityId}`)
    const vendors = await this.cacheAside.get(
      `discovery:city:${cityId}:limit:${limit}`,
      () => this.vendorProfileRepository.findByCity(cityId, limit),
      { ttl: 900 },
    )
    const withMetrics = await this.attachReviewMetrics(vendors as Array<{ id: string }>)
    return withMetrics as unknown as VendorProfile[]
  }

  /**
   * Generate unique slug from business name
   */
  async generateSlug(businessName: string): Promise<string> {
    const base = slugify(businessName || 'vendor', { lower: true, strict: true }) || 'vendor'
    let slug = base
    let counter = 1

    while (await this.vendorProfileRepository.findBySlug(slug)) {
      slug = `${base}-${counter}`
      counter++
    }

    return slug
  }

  /**
   * Submit profile for review
   */
  async submitForReview(id: string): Promise<VendorProfile> {
    this.logger.log(`Submitting vendor profile for review: ${id}`)

    const vendorProfile = await this.findById(id, false)

    if (vendorProfile.status !== 'DRAFT') {
      throw new BadRequestException('Only draft profiles can be submitted for review')
    }

    const updated = await this.vendorProfileRepository.update(id, {
      status: 'PENDING_REVIEW',
    })

    // Emit event for operations team
    this.eventEmitter.emit(VENDOR_EVENTS.VERIFICATION_REQUESTED, {
      vendorProfileId: id,
      businessName: vendorProfile.businessName,
      userId: vendorProfile.userId,
    })

    return updated
  }

  /**
   * Activate vendor profile (admin only)
   */
  async activate(id: string): Promise<VendorProfile> {
    this.logger.log(`Activating vendor profile: ${id}`)

    const updated = await this.vendorProfileRepository.update(id, {
      status: 'ACTIVE',
      verifiedAt: new Date(),
    })

    // Emit event
    this.eventEmitter.emit(VENDOR_EVENTS.VERIFIED, {
      vendorProfileId: id,
      userId: updated.userId,
    })

    return updated
  }

  /**
   * Suspend vendor profile (admin only)
   */
  async suspend(id: string, reason: string): Promise<VendorProfile> {
    this.logger.log(`Suspending vendor profile: ${id}`)

    const updated = await this.vendorProfileRepository.update(id, {
      status: 'SUSPENDED',
    })

    // Emit event
    this.eventEmitter.emit(VENDOR_EVENTS.REJECTED, {
      vendorProfileId: id,
      userId: updated.userId,
      reason,
    })

    return updated
  }

  /**
   * Upload profile photo for vendor
   */
  async uploadProfilePhoto(
    id: string,
    file: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<VendorProfile> {
    this.logger.log(`Uploading profile photo for vendor: ${id}`)

    // Get existing profile
    const profile = await this.findById(id, false)

    // Delete old profile photo if exists
    if (profile.profilePhotoUrl) {
      try {
        // Extract path from URL
        const urlParts = profile.profilePhotoUrl.split('/')
        const existingPath = urlParts.slice(3).join('/') // Remove protocol and domain
        await this.uploadService.deleteFile(existingPath)
        this.logger.debug(`Deleted old profile photo: ${existingPath}`)
      } catch (error) {
        this.logger.warn(`Failed to delete old profile photo: ${error.message}`)
      }
    }

    // Upload new profile photo with WebP conversion
    const uploadResult = await this.uploadService.uploadImage(
      file,
      originalName,
      FileCategory.VENDOR_PROFILE,
      mimeType,
      {
        customPath: `${FileCategory.VENDOR_PROFILE}/${id}/${Date.now()}.webp`,
        imageProcessing: {
          convertToWebP: true,
          quality: 80,
          maxWidth: 800,
          maxHeight: 800,
        },
      },
    )

    // Update profile with new photo URL
    const updated = await this.vendorProfileRepository.update(id, {
      profilePhotoUrl: uploadResult.url,
    })

    // Invalidate cache
    await this.cacheAside.invalidate(`vendor:slug:${profile.slug}`)

    this.logger.log(`Profile photo uploaded for vendor: ${id}`)
    return updated
  }

  /**
   * Delete profile photo for vendor
   */
  async deleteProfilePhoto(id: string): Promise<VendorProfile> {
    this.logger.log(`Deleting profile photo for vendor: ${id}`)

    const profile = await this.findById(id, false)

    if (profile.profilePhotoUrl) {
      try {
        const urlParts = profile.profilePhotoUrl.split('/')
        const existingPath = urlParts.slice(3).join('/')
        await this.uploadService.deleteFile(existingPath)
      } catch (error) {
        this.logger.warn(`Failed to delete profile photo: ${error.message}`)
      }
    }

    const updated = await this.vendorProfileRepository.update(id, {
      profilePhotoUrl: null,
    })

    // Invalidate cache
    await this.cacheAside.invalidate(`vendor:slug:${profile.slug}`)

    return updated
  }
}
