import { Controller, Get, Param, Query } from '@nestjs/common';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import { PortfolioService } from '../../../domain/catalog/services/portfolio.service';
import {
  SearchVendorProfileDto,
  VendorProfileResponseDto,
  SearchVendorIndexDto,
  SearchNearbyVendorsDto,
  VendorSuggestionsDto,
} from '../../../domain/catalog/dto/vendor-profile.dto';
import {
  SearchPortfolioMediaDto,
  PortfolioMediaItemResponseDto,
} from '../../../domain/catalog/dto/portfolio.dto';
import { VendorIndexer } from '../../../infrastructure/search/indexers/vendor.indexer';
import { Public } from '../../../core/auth/decorators/public.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';

@Public()
@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly vendorProfileService: VendorProfileService,
    private readonly portfolioService: PortfolioService,
    private readonly vendorIndexer: VendorIndexer,
  ) {}

  @Get('vendors')
  searchVendors(
    @Query() query: SearchVendorProfileDto,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.vendorProfileService.search(query, user?.id);
  }

  @Get('search')
  searchVendorsIndexed(@Query() query: SearchVendorIndexDto) {
    return this.vendorIndexer.searchVendors(query.query || '', {
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
  }

  @Get('nearby')
  searchNearbyVendors(@Query() query: SearchNearbyVendorsDto) {
    return this.vendorIndexer.searchNearbyVendors(
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
  }

  @Get('suggestions')
  getVendorSuggestions(@Query() query: VendorSuggestionsDto) {
    return this.vendorIndexer.getVendorSuggestions(query.query, query.limit);
  }

  @Get('vendors/:slug')
  getVendorBySlug(
    @Param('slug') slug: string,
  ): Promise<VendorProfileResponseDto> {
    return this.vendorProfileService.findBySlug(slug);
  }

  @Get('featured')
  getFeatured(
    @Query('limit') limit?: number,
  ): Promise<VendorProfileResponseDto[]> {
    return this.vendorProfileService.getFeatured(limit || 10);
  }

  @Get('media')
  getPortfolioMedia(@Query() query: SearchPortfolioMediaDto): Promise<{
    data: PortfolioMediaItemResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    return this.portfolioService.getPublicMediaFeed(query);
  }

  @Get('categories/:categoryId/vendors')
  getVendorsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit?: number,
  ): Promise<VendorProfileResponseDto[]> {
    return this.vendorProfileService.getByCategory(categoryId, limit || 20);
  }

  @Get('cities/:cityId/vendors')
  getVendorsByCity(
    @Param('cityId') cityId: string,
    @Query('limit') limit?: number,
  ): Promise<VendorProfileResponseDto[]> {
    return this.vendorProfileService.getByCity(cityId, limit || 20);
  }
}
