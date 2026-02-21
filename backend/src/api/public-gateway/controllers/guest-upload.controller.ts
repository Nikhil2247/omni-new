// ============================================================================
// GUEST UPLOAD CONTROLLER - Public Gateway (No Auth Required)
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { GuestUploadService } from '../../../domain/planning/services/guest-upload.service';
import {
  UploadService,
  FileCategory,
} from '../../../infrastructure/storage/upload.service';
import { MinioService } from '../../../infrastructure/storage/minio.service';
import { CreateGuestUploadDto } from '../../../domain/planning/dto/guest-upload.dto';

@Controller('guest-upload')
@ApiTags('Guest Upload (Public)')
@Public()
export class GuestUploadController {
  constructor(
    private readonly guestUploadService: GuestUploadService,
    private readonly uploadService: UploadService,
    private readonly minioService: MinioService,
  ) {}

  @Get(':eventCode')
  @ApiOperation({ summary: 'Get event memory settings by QR code' })
  @ApiParam({ name: 'eventCode', description: 'Event QR code / event code' })
  async getMemorySettings(@Param('eventCode') eventCode: string) {
    const memory = await this.guestUploadService.getMemoryByCode(eventCode);

    // Only return public-safe information
    return {
      id: memory.id,
      qrCode: memory.qrCode,
      isActive: memory.isActive,
      allowUploads: memory.allowUploads,
      requireApproval: memory.requireApproval,
      expiresAt: memory.expiresAt,
      event: memory.event
        ? {
            id: memory.event.id,
            name: memory.event.name,
            date: memory.event.date,
          }
        : null,
    };
  }

  @Post(':eventCode/upload')
  @ApiOperation({
    summary: 'Upload a photo/video to event memory (no auth required)',
  })
  @ApiParam({ name: 'eventCode', description: 'Event QR code / event code' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        uploaderName: { type: 'string' },
        uploaderEmail: { type: 'string' },
        caption: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('eventCode') eventCode: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGuestUploadDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Get memory by code to validate and get ID
    const memory = await this.guestUploadService.getMemoryByCode(eventCode);

    // Validate memory is active and accepts uploads
    if (!memory.isActive) {
      throw new BadRequestException('This event memory is not active');
    }

    if (!memory.allowUploads) {
      throw new BadRequestException('Uploads are not allowed for this event');
    }

    if (memory.expiresAt && new Date(memory.expiresAt) < new Date()) {
      throw new BadRequestException('This event memory has expired');
    }

    // Determine media type
    const isVideo = file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

    // Upload file to MinIO with WebP conversion for images
    const uploaded = isVideo
      ? await this.uploadService.uploadFile(
          file.buffer,
          file.originalname,
          FileCategory.EVENT_GALLERY,
          file.mimetype,
        )
      : await this.uploadService.uploadImage(
          file.buffer,
          file.originalname,
          FileCategory.EVENT_GALLERY,
          file.mimetype,
          {
            imageProcessing: {
              convertToWebP: true,
              quality: 80,
              generateThumbnail: true,
              thumbnailWidth: 400,
              thumbnailHeight: 400,
            },
          },
        );

    // Create guest upload record
    const guestUpload = await this.guestUploadService.create({
      eventMemoryId: memory.id,
      uploaderName: dto.uploaderName,
      uploaderEmail: dto.uploaderEmail,
      mediaUrl: uploaded.path,
      thumbnailUrl: uploaded.thumbnailPath,
      mediaType,
      fileSize: uploaded.size,
      caption: dto.caption,
    });

    const mediaUrl = guestUpload.mediaUrl
      ? await this.minioService.getFileUrl(guestUpload.mediaUrl)
      : guestUpload.mediaUrl;
    const thumbnailUrl = guestUpload.thumbnailUrl
      ? await this.minioService.getFileUrl(guestUpload.thumbnailUrl)
      : guestUpload.thumbnailUrl;

    return {
      id: guestUpload.id,
      status: guestUpload.status,
      mediaUrl,
      thumbnailUrl,
      message:
        guestUpload.status === 'PENDING'
          ? 'Your photo has been submitted and is awaiting approval'
          : 'Your photo has been uploaded successfully',
    };
  }

  @Get(':eventCode/gallery')
  @ApiOperation({ summary: 'Get approved uploads for public gallery view' })
  @ApiParam({ name: 'eventCode', description: 'Event QR code / event code' })
  async getPublicGallery(@Param('eventCode') eventCode: string) {
    const uploads = await this.guestUploadService.findByEventCode(eventCode);

    const mappedUploads = await Promise.all(
      uploads.map(async (upload) => ({
        id: upload.id,
        mediaUrl: upload.mediaUrl
          ? await this.minioService.getFileUrl(upload.mediaUrl)
          : upload.mediaUrl,
        thumbnailUrl: upload.thumbnailUrl
          ? await this.minioService.getFileUrl(upload.thumbnailUrl)
          : upload.thumbnailUrl,
        mediaType: upload.mediaType,
        uploaderName: upload.uploaderName,
        caption: upload.caption,
        createdAt: upload.createdAt,
      })),
    );

    return {
      count: mappedUploads.length,
      uploads: mappedUploads,
    };
  }
}
