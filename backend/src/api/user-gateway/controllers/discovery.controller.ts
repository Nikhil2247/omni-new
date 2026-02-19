// ============================================================================
// USER GATEWAY - Discovery Controller
// ============================================================================
// Vendor discovery and search endpoints for end users
// ============================================================================

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import {
  SearchVendorProfileDto,
  VendorProfileResponseDto,
  SearchVendorIndexDto,
  SearchNearbyVendorsDto,
  VendorSuggestionsDto,
} from '../../../domain/catalog/dto/vendor-profile.dto';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { UserId } from '../../../core/auth/decorators/current-user.decorator';
import { VendorIndexer } from '../../../infrastructure/search/indexers/vendor.indexer';
import { ANALYTICS_EVENTS } from '../../../core/events/event-constants';

class VendorClickDto {
  @IsUUID()
  vendorProfileId: string;

  @IsOptional()
  @IsString()
  query?: string;
}

@ApiTags('User - Vendor Discovery')
@ApiBearerAuth()
@Controller('user/discovery')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class DiscoveryController {
  constructor(
    private readonly vendorProfileService: VendorProfileService,
    private readonly vendorIndexer: VendorIndexer,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Search vendors with filters
   */
  @Get('vendors')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Search vendors with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
  async searchVendors(
    @Query() searchDto: SearchVendorProfileDto,
    @UserId() userId: string,
  ): Promise<PaginatedResult<VendorProfileResponseDto>> {
    const result = await this.vendorProfileService.search(searchDto);

    this.eventEmitter.emit(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      query: searchDto.query || 'all',
      userId,
      categoryId: searchDto.categoryId,
      cityId: searchDto.cityId,
      filters: {
        sortBy: searchDto.sortBy,
        sortOrder: searchDto.sortOrder,
      },
      resultCount: result.meta.total,
      hasResults: result.meta.total > 0,
    });

    result.data.forEach((vendor) => {
      this.eventEmitter.emit('vendor.search.appeared', {
        vendorProfileId: vendor.id,
      });
    });

    return result;
  }

  /**
   * Search vendors with full-text index
   */
  @Get('search')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Search vendors using full-text index' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchVendorsIndexed(
    @Query() query: SearchVendorIndexDto,
    @UserId() userId: string,
  ) {
    const result = await this.vendorIndexer.searchVendors(query.query || '', {
      page: query.page,
      hitsPerPage: query.limit,
      categoryId: query.categoryId,
      city: query.city,
      country: query.country,
      serviceAreaCityId: query.serviceAreaCityId,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      isVerified: query.isVerified,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    this.eventEmitter.emit(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      query: query.query || 'all',
      userId,
      categoryId: query.categoryId,
      filters: {
        city: query.city,
        country: query.country,
        serviceAreaCityId: query.serviceAreaCityId,
        priceMin: query.priceMin,
        priceMax: query.priceMax,
        isVerified: query.isVerified,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      resultCount: result.totalHits,
      hasResults: result.totalHits > 0,
    });

    result.hits.forEach((vendor) => {
      this.eventEmitter.emit('vendor.search.appeared', {
        vendorProfileId: vendor.id,
      });
    });

    return result;
  }

  /**
   * Search nearby vendors using geo search
   */
  @Get('nearby')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: 'Search nearby vendors by geo radius' })
  @ApiResponse({
    status: 200,
    description: 'Nearby vendors retrieved successfully',
  })
  async searchNearbyVendors(
    @Query() query: SearchNearbyVendorsDto,
    @UserId() userId: string,
  ) {
    const result = await this.vendorIndexer.searchNearbyVendors(
      query.query || '',
      query.lat,
      query.lng,
      query.radiusInMeters,
      {
        page: query.page,
        hitsPerPage: query.limit,
        categoryId: query.categoryId,
      },
    );

    this.eventEmitter.emit(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      query: query.query || 'all',
      userId,
      categoryId: query.categoryId,
      filters: {
        lat: query.lat,
        lng: query.lng,
        radiusInMeters: query.radiusInMeters,
      },
      resultCount: result.totalHits,
      hasResults: result.totalHits > 0,
    });

    result.hits.forEach((vendor) => {
      this.eventEmitter.emit('vendor.search.appeared', {
        vendorProfileId: vendor.id,
      });
    });

    return result;
  }

  /**
   * Get vendor search suggestions
   */
  @Get('suggestions')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Get vendor search suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Suggestions retrieved successfully',
  })
  async getVendorSuggestions(@Query() query: VendorSuggestionsDto) {
    return this.vendorIndexer.getVendorSuggestions(query.query, query.limit);
  }

  /**
   * Get vendor by slug (public profile view)
   */
  @Get('vendors/:slug')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Get vendor profile by slug' })
  @ApiParam({ name: 'slug', description: 'Vendor slug' })
  @ApiResponse({ status: 200, description: 'Vendor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorBySlug(
    @Param('slug') slug: string,
    @UserId() userId: string,
  ): Promise<VendorProfileResponseDto> {
    const vendor = await this.vendorProfileService.findBySlug(slug);

    this.eventEmitter.emit(ANALYTICS_EVENTS.PROFILE_VIEWED, {
      vendorProfileId: vendor.id,
      viewerId: userId,
      source: 'direct',
    });

    return vendor;
  }

  /**
   * Track vendor search click
   */
  @Post('search/click')
  async trackSearchClick(
    @Body() dto: VendorClickDto,
    @UserId() userId: string,
  ) {
    this.eventEmitter.emit('vendor.search.clicked', {
      vendorProfileId: dto.vendorProfileId,
    });

    if (dto.query) {
      this.eventEmitter.emit(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
        query: dto.query,
        userId,
        resultCount: 1,
        hasResults: true,
        filters: { clickedVendorId: dto.vendorProfileId },
      });
    }

    return { success: true };
  }

  /**
   * Get featured vendors
   */
  @Get('featured')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Get featured vendors' })
  @ApiResponse({
    status: 200,
    description: 'Featured vendors retrieved successfully',
  })
  async getFeaturedVendors(
    @Query('limit') limit?: number,
  ): Promise<VendorProfileResponseDto[]> {
    return this.vendorProfileService.getFeatured(limit || 10);
  }

  /**
   * Get vendors by category
   */
  @Get('categories/:categoryId/vendors')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Get vendors by category' })
  @ApiParam({ name: 'categoryId', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
  async getVendorsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit?: number,
  ): Promise<VendorProfileResponseDto[]> {
    return this.vendorProfileService.getByCategory(categoryId, limit || 20);
  }

  /**
   * Get vendors by city
   */
  @Get('cities/:cityId/vendors')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Get vendors by city' })
  @ApiParam({ name: 'cityId', description: 'City UUID' })
  @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
  async getVendorsByCity(
    @Param('cityId') cityId: string,
    @Query('limit') limit?: number,
  ): Promise<VendorProfileResponseDto[]> {
    return this.vendorProfileService.getByCity(cityId, limit || 20);
  }
}
