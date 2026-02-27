import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  UploadService,
  FileCategory,
} from '../../../infrastructure/storage/upload.service';
import { Public } from '../../../core/auth/decorators/public.decorator';

interface PresignedUploadRequest {
  filename: string;
  mimeType: string;
  category?: string;
  expiresIn?: number;
}

interface PresignedUploadResponse {
  uploadUrl: string;
  filePath: string;
  fileUrl: string;
}

@Public()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Get a presigned URL for direct browser upload' })
  @ApiResponse({
    status: 200,
    description: 'Presigned upload URL with file paths',
    schema: {
      example: {
        uploadUrl: 'https://minio.example.com/bucket/path?signature=...',
        filePath: 'media/2026/02/1234567890-uuid.png',
        fileUrl: 'https://cdn.example.com/media/2026/02/1234567890-uuid.png',
      },
    },
  })
  async getPresignedUpload(
    @Body() body: PresignedUploadRequest,
  ): Promise<PresignedUploadResponse> {
    const filename = body?.filename?.trim();
    const mimeType = body?.mimeType?.trim();
    const category = (body?.category || FileCategory.MEDIA) as FileCategory;

    if (!filename || !mimeType) {
      throw new BadRequestException('filename and mimeType are required');
    }

    if (!Object.values(FileCategory).includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    return this.uploadService.getPresignedUploadUrl(
      category,
      filename,
      mimeType,
      body?.expiresIn,
    );
  }
}
