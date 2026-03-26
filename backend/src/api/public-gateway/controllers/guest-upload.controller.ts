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
  ForbiddenException,
  Logger,
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
import { UserUsageService } from '../../../domain/subscription/services/user-usage.service';

@Controller('guest-upload')
@ApiTags('Guest Upload (Public)')
@Public()
export class GuestUploadController {
  private readonly logger = new Logger(GuestUploadController.name);

  constructor(
    private readonly guestUploadService: GuestUploadService,
    private readonly uploadService: UploadService,
    private readonly minioService: MinioService,
    private readonly userUsageService: UserUsageService,
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

    // Check upload limit for event owner
    // memory.event contains the event with userId (owner)
    const eventId = memory.event?.id;
    const ownerId = (memory.event as any)?.userId;

    if (eventId && ownerId) {
      // Check upload count limit
      try {
        const uploadCountStatus = await this.userUsageService.checkFeatureLimit(
          ownerId,
          eventId,
          'memory_uploads_per_event',
        );

        if (!uploadCountStatus.isUnlimited && uploadCountStatus.remaining <= 0) {
          throw new ForbiddenException({
            message: 'Upload limit reached',
            error: 'MEMORY_UPLOADS_LIMIT_EXCEEDED',
            details: {
              eventId,
              currentCount: uploadCountStatus.used,
              limit: uploadCountStatus.limit,
              planUpgradeRequired: true,
            },
            userMessage: `The event has reached its upload limit of ${uploadCountStatus.limit} files. Please contact the event organizer to upgrade their plan.`,
          });
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        this.logger.warn(
          `Failed to check upload count limit for event ${eventId}: ${error.message}`,
        );
      }

      // Check storage limit
      try {
        const storageStatus = await this.userUsageService.checkStorageLimit(
          ownerId,
          eventId,
          file.size,
        );

        if (!storageStatus.isUnlimited && !storageStatus.allowed) {
          throw new ForbiddenException({
            message: 'Storage limit reached',
            error: 'MEMORY_STORAGE_LIMIT_EXCEEDED',
            details: {
              eventId,
              currentUsageMB: Math.round(storageStatus.currentUsageMB * 100) / 100,
              limitMB: storageStatus.limitMB,
              remainingMB: Math.round(storageStatus.remainingMB * 100) / 100,
              fileSizeMB: Math.round(storageStatus.fileSizeMB * 100) / 100,
              planUpgradeRequired: true,
            },
            userMessage: `The event has reached its storage limit of ${storageStatus.limitMB}MB (used: ${Math.round(storageStatus.currentUsageMB)}MB). This file (${Math.round(storageStatus.fileSizeMB * 100) / 100}MB) cannot be uploaded. Please contact the event organizer.`,
          });
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        this.logger.warn(
          `Failed to check storage limit for event ${eventId}: ${error.message}`,
        );
      }
    }

    // Determine media type
    const isVideo = file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

    // Generate custom storage path: username/eventname/all-photos
    const eventUser = (memory.event as any)?.user;
    const eventName = memory.event?.name || 'unknown-event';
    const userName = eventUser
      ? (eventUser.firstName && eventUser.lastName
          ? `${eventUser.firstName}-${eventUser.lastName}`
          : eventUser.email?.split('@')[0] || 'unknown-user')
      : 'unknown-user';

    // Sanitize folder names (remove special characters, spaces -> hyphens)
    const sanitize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const sanitizedUserName = sanitize(userName);
    const sanitizedEventName = sanitize(eventName);
    const timestamp = Date.now();
    const customPath = `memories/${sanitizedUserName}/${sanitizedEventName}/all-photos/${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload file to MinIO with WebP conversion for images (max quality)
    const uploaded = isVideo
      ? await this.uploadService.uploadFile(
          file.buffer,
          file.originalname,
          FileCategory.EVENT_GALLERY,
          file.mimetype,
          { customPath },
        )
      : await this.uploadService.uploadImage(
          file.buffer,
          file.originalname,
          FileCategory.EVENT_GALLERY,
          file.mimetype,
          {
            customPath,
            imageProcessing: {
              convertToWebP: true,
              quality: 100, // Max quality for memory wall photos
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

    // Record usage for event owner after successful upload
    if (eventId && ownerId) {
      // Record upload count
      try {
        await this.userUsageService.recordUsage(
          ownerId,
          eventId,
          'memory_uploads_per_event',
          1,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to record upload count for event ${eventId}: ${error.message}`,
        );
      }

      // Record storage usage
      try {
        await this.userUsageService.recordStorageUsage(
          ownerId,
          eventId,
          guestUpload.fileSize || file.size,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to record storage usage for event ${eventId}: ${error.message}`,
        );
      }
    }

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
