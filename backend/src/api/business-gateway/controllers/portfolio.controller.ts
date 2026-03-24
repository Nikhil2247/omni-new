import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { PortfolioService } from '../../../domain/catalog/services/portfolio.service';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  CreateMediaItemDto,
  UpdateMediaItemDto,
} from '../../../domain/catalog/dto/portfolio.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  UploadService,
  FileCategory,
} from '../../../infrastructure/storage/upload.service';
import { MinioService } from '../../../infrastructure/storage/minio.service';
import { StoragePathHelper } from '../../../infrastructure/storage/storage-path.helper';
import { PrismaService } from '../../../core/database/prisma.service';
import { UsageService } from '../../../domain/subscription/services/usage.service';

@Controller('portfolio')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly uploadService: UploadService,
    private readonly minioService: MinioService,
    private readonly storagePathHelper: StoragePathHelper,
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
  ) {}

  /**
   * Get vendor slug from portfolio ID
   */
  private async getVendorSlugForPortfolio(portfolioId: string): Promise<string> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        vendorProfile: {
          select: { slug: true },
        },
      },
    });
    return portfolio?.vendorProfile?.slug || 'unknown';
  }

  @Post()
  create(@Body() dto: CreatePortfolioDto) {
    return this.portfolioService
      .create(dto)
      .then((result) => this.normalizeMediaUrlsInResponse(result));
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.portfolioService
      .findById(id)
      .then((result) => this.normalizeMediaUrlsInResponse(result));
  }

  @Get()
  findByVendor(@Query('vendorProfileId') vendorProfileId: string) {
    return this.portfolioService
      .findByVendorProfile(vendorProfileId)
      .then((result) => this.normalizeMediaUrlsInResponse(result));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.portfolioService
      .update(id, dto)
      .then((result) => this.normalizeMediaUrlsInResponse(result));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.portfolioService.delete(id);
    return { success: true };
  }

  @Post(':id/media')
  addMediaItem(@Param('id') id: string, @Body() dto: CreateMediaItemDto) {
    return this.portfolioService
      .addMediaItem(id, dto)
      .then((result) => this.normalizeMediaUrlsInResponse(result));
  }

  @Delete('media/:mediaId')
  deleteMediaItem(@Param('mediaId') mediaId: string) {
    return this.portfolioService.deleteMediaItem(mediaId);
  }

  @Put('media/:mediaId')
  updateMediaItem(
    @Param('mediaId') mediaId: string,
    @Body() dto: UpdateMediaItemDto,
  ) {
    return this.portfolioService
      .updateMediaItem(mediaId, dto)
      .then((result) => this.normalizeMediaUrlsInResponse(result));
  }

  @Put(':id/reorder')
  reorderMediaItems(
    @Param('id') portfolioId: string,
    @Body('itemIds') itemIds: string[],
  ) {
    return this.portfolioService
      .reorderMediaItems(portfolioId, itemIds)
      .then((result) => this.normalizeMediaUrlsInResponse(result));
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Param('id') portfolioId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText?: string,
    @Body('caption') caption?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Get vendor slug for path generation
    const vendorSlug = await this.getVendorSlugForPortfolio(portfolioId);

    // Generate path using StoragePathHelper: vendors/{vendorSlug}/portfolio/{filename}.webp
    const storagePath = this.storagePathHelper.vendorPortfolio(
      { vendorSlug },
      file.originalname,
    );

    // Generate thumbnail path: vendors/{vendorSlug}/portfolio/thumbnails/{filename}.webp
    const thumbnailPath = this.storagePathHelper.vendorPortfolioThumbnail(
      { vendorSlug },
      file.originalname,
    );

    // Upload to MinIO with WebP conversion
    const uploaded = await this.uploadService.uploadImage(
      file.buffer,
      file.originalname,
      FileCategory.PORTFOLIO,
      file.mimetype,
      {
        customPath: storagePath,
        imageProcessing: {
          convertToWebP: true,
          quality: 70,
          generateThumbnail: true,
          thumbnailWidth: 400,
          thumbnailHeight: 400,
        },
      },
    );

    // Add media item to portfolio
    const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    const mediaItem = await this.portfolioService.addMediaItem(portfolioId, {
      type: mediaType,
      url: uploaded.path,
      thumbnailUrl: uploaded.thumbnailPath,
      size: uploaded.size,
      mimeType: uploaded.mimeType,
      width: uploaded.width,
      height: uploaded.height,
      altText,
      caption,
    });

    return this.normalizeMediaUrlsInResponse(mediaItem);
  }

  @Post(':id/upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleMedia(
    @Param('id') portfolioId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Get portfolio with vendor profile for limit check
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        vendorProfile: {
          select: { id: true, slug: true },
        },
      },
    });

    if (!portfolio) {
      throw new BadRequestException('Portfolio not found');
    }

    // Check images_per_album limit before uploading
    try {
      const limitStatus = await this.usageService.checkFeatureLimit(
        portfolio.vendorProfileId,
        'images_per_album',
      );

      if (!limitStatus.isUnlimited && limitStatus.limit > 0) {
        // Get current image count for this portfolio
        const currentCount = await this.prisma.mediaItem.count({
          where: { portfolioId },
        });

        const availableSlots = limitStatus.limit - currentCount;

        if (availableSlots <= 0) {
          throw new ForbiddenException({
            message: 'Images per album limit reached',
            error: 'IMAGES_PER_ALBUM_LIMIT_EXCEEDED',
            details: {
              portfolioId,
              currentCount,
              limit: limitStatus.limit,
              availableSlots: 0,
              requestedCount: files.length,
              planUpgradeRequired: true,
            },
            userMessage: `You have reached the maximum of ${limitStatus.limit} images per album on your current plan. Please upgrade your subscription to add more images.`,
          });
        }

        if (files.length > availableSlots) {
          throw new ForbiddenException({
            message: 'Upload would exceed images per album limit',
            error: 'IMAGES_PER_ALBUM_LIMIT_WOULD_EXCEED',
            details: {
              portfolioId,
              currentCount,
              limit: limitStatus.limit,
              availableSlots,
              requestedCount: files.length,
              planUpgradeRequired: availableSlots === 0,
            },
            userMessage: `You can only add ${availableSlots} more image${availableSlots === 1 ? '' : 's'} to this album (limit: ${limitStatus.limit}). You're trying to upload ${files.length} files. Please reduce the number of files or upgrade your subscription.`,
          });
        }
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Log but continue if usage service fails
      console.warn(`Failed to check images_per_album limit: ${error.message}`);
    }

    // Get vendor slug for path generation
    const vendorSlug = portfolio.vendorProfile?.slug || 'unknown';

    const results: Awaited<ReturnType<PortfolioService['addMediaItem']>>[] = [];
    for (const file of files) {
      // Generate path using StoragePathHelper: vendors/{vendorSlug}/portfolio/{filename}.webp
      const storagePath = this.storagePathHelper.vendorPortfolio(
        { vendorSlug },
        file.originalname,
      );

      // Upload to MinIO with WebP conversion
      const uploaded = await this.uploadService.uploadImage(
        file.buffer,
        file.originalname,
        FileCategory.PORTFOLIO,
        file.mimetype,
        {
          customPath: storagePath,
          imageProcessing: {
            convertToWebP: true,
            quality: 70,
            generateThumbnail: true,
            thumbnailWidth: 400,
            thumbnailHeight: 400,
          },
        },
      );

      // Add media item to portfolio
      const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      const mediaItem = await this.portfolioService.addMediaItem(portfolioId, {
        type: mediaType,
        url: uploaded.path,
        thumbnailUrl: uploaded.thumbnailPath,
        size: uploaded.size,
        mimeType: uploaded.mimeType,
        width: uploaded.width,
        height: uploaded.height,
      });

      results.push(mediaItem);
    }

    return this.normalizeMediaUrlsInResponse(results);
  }

  private async normalizeMediaUrlsInResponse<T>(payload: T): Promise<T> {
    return (await this.normalizeValue(payload, null)) as T;
  }

  private async normalizeValue(
    value: unknown,
    key: string | null,
  ): Promise<unknown> {
    if (value == null) {
      return value;
    }

    if (typeof value === 'string') {
      if (!this.isMediaKey(key)) {
        return value;
      }
      const objectPath = this.extractObjectPath(value);
      if (!objectPath) {
        return value;
      }
      return this.minioService.getFileUrl(objectPath);
    }

    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => this.normalizeValue(item, null)));
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      const normalized = await Promise.all(
        entries.map(async ([entryKey, entryValue]) => [
          entryKey,
          await this.normalizeValue(entryValue, entryKey),
        ]),
      );
      return Object.fromEntries(normalized);
    }

    return value;
  }

  private isMediaKey(key: string | null): boolean {
    if (!key) {
      return false;
    }

    return /^(url|thumbnailUrl|cdnUrl|mediaUrl|profilePhotoUrl|avatarUrl|imageUrl|logo|featuredImage|ogImage)$/i.test(
      key,
    );
  }

  private extractObjectPath(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      const normalized = trimmed.replace(/^\/+/, '');
      return normalized.includes('/') ? normalized : null;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.toLowerCase() === 'files.omnicassion.com') {
        return null;
      }

      const mediaPathParam = parsed.searchParams.get('path');
      if (mediaPathParam) {
        return decodeURIComponent(mediaPathParam).replace(/^\/+/, '');
      }

      const segments = decodeURIComponent(parsed.pathname)
        .split('/')
        .filter(Boolean);
      if (segments.length <= 1) {
        return null;
      }

      const bucket = this.minioService.getDefaultBucket();
      if (segments[0] === bucket) {
        return segments.slice(1).join('/');
      }

      return null;
    } catch {
      return null;
    }
  }
}
