// ============================================================================
// TASK ATTACHMENT DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';

export enum AttachmentType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  DOCUMENT = 'DOCUMENT',
  RECEIPT = 'RECEIPT',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

export class CreateTaskAttachmentDto {
  @ApiProperty({ description: 'Task ID' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Attachment type', enum: AttachmentType })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiProperty({ description: 'File URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsInt()
  @Min(0)
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Uploaded by user ID' })
  @IsUUID()
  uploadedBy: string;
}

export class TaskAttachmentResponseDto {
  @ApiProperty({ description: 'Attachment ID' })
  id: string;

  @ApiProperty({ description: 'Task ID' })
  taskId: string;

  @ApiProperty({ description: 'Type', enum: AttachmentType })
  type: AttachmentType;

  @ApiProperty({ description: 'URL' })
  url: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Uploaded by' })
  uploadedBy: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}
