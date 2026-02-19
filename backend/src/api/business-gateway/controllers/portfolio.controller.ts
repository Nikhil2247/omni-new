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

@Controller('portfolio')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  create(@Body() dto: CreatePortfolioDto) {
    return this.portfolioService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.portfolioService.findById(id);
  }

  @Get()
  findByVendor(@Query('vendorProfileId') vendorProfileId: string) {
    return this.portfolioService.findByVendorProfile(vendorProfileId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.portfolioService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.portfolioService.delete(id);
    return { success: true };
  }

  @Post(':id/media')
  addMediaItem(@Param('id') id: string, @Body() dto: CreateMediaItemDto) {
    return this.portfolioService.addMediaItem(id, dto);
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
    return this.portfolioService.updateMediaItem(mediaId, dto);
  }

  @Put(':id/reorder')
  reorderMediaItems(
    @Param('id') portfolioId: string,
    @Body('itemIds') itemIds: string[],
  ) {
    return this.portfolioService.reorderMediaItems(portfolioId, itemIds);
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

    // Upload to MinIO with WebP conversion
    const uploaded = await this.uploadService.uploadImage(
      file.buffer,
      file.originalname,
      FileCategory.PORTFOLIO,
      file.mimetype,
      {
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

    return mediaItem;
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

    const results: Awaited<ReturnType<PortfolioService['addMediaItem']>>[] = [];
    for (const file of files) {
      // Upload to MinIO with WebP conversion
      const uploaded = await this.uploadService.uploadImage(
        file.buffer,
        file.originalname,
        FileCategory.PORTFOLIO,
        file.mimetype,
        {
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

    return results;
  }
}
