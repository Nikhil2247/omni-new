// ============================================================================
// GUEST UPLOADS CONTROLLER - User Gateway (Owner Endpoints)
// ============================================================================

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { GuestUploadService } from '../../../domain/planning/services/guest-upload.service';
import { BulkUploadActionDto } from '../../../domain/planning/dto/guest-upload.dto';
import { UploadStatus } from '@prisma/client';

@Controller('memories')
@ApiTags('Guest Uploads Management')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class GuestUploadsController {
  constructor(private readonly guestUploadService: GuestUploadService) {}

  @Get(':memoryId/uploads')
  @ApiOperation({ summary: 'Get all uploads for a memory' })
  @ApiParam({ name: 'memoryId', description: 'Event memory ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  async findAll(
    @Param('memoryId') memoryId: string,
    @Query('status') status?: UploadStatus,
  ) {
    const uploads = await this.guestUploadService.findByMemory(
      memoryId,
      status,
    );
    return {
      count: uploads.length,
      uploads,
    };
  }

  @Get(':memoryId/uploads/pending-count')
  @ApiOperation({ summary: 'Get count of pending uploads' })
  @ApiParam({ name: 'memoryId', description: 'Event memory ID' })
  async getPendingCount(@Param('memoryId') memoryId: string) {
    const count = await this.guestUploadService.countPending(memoryId);
    return { pendingCount: count };
  }

  @Patch('uploads/:uploadId/approve')
  @ApiOperation({ summary: 'Approve an upload' })
  @ApiParam({ name: 'uploadId', description: 'Guest upload ID' })
  async approve(@Param('uploadId') uploadId: string) {
    const upload = await this.guestUploadService.approve(uploadId);
    return upload;
  }

  @Patch('uploads/:uploadId/reject')
  @ApiOperation({ summary: 'Reject an upload' })
  @ApiParam({ name: 'uploadId', description: 'Guest upload ID' })
  async reject(@Param('uploadId') uploadId: string) {
    const upload = await this.guestUploadService.reject(uploadId);
    return upload;
  }

  @Delete('uploads/:uploadId')
  @ApiOperation({ summary: 'Delete an upload' })
  @ApiParam({ name: 'uploadId', description: 'Guest upload ID' })
  async delete(@Param('uploadId') uploadId: string) {
    await this.guestUploadService.delete(uploadId);
    return { success: true };
  }

  @Patch(':memoryId/uploads/bulk-approve')
  @ApiOperation({ summary: 'Bulk approve uploads' })
  @ApiParam({ name: 'memoryId', description: 'Event memory ID' })
  async bulkApprove(
    @Param('memoryId') memoryId: string,
    @Body() dto: BulkUploadActionDto,
  ) {
    const uploads = await this.guestUploadService.bulkApprove(dto.ids);
    return {
      count: uploads.length,
      uploads,
    };
  }

  @Patch(':memoryId/uploads/bulk-reject')
  @ApiOperation({ summary: 'Bulk reject uploads' })
  @ApiParam({ name: 'memoryId', description: 'Event memory ID' })
  async bulkReject(
    @Param('memoryId') memoryId: string,
    @Body() dto: BulkUploadActionDto,
  ) {
    const uploads = await this.guestUploadService.bulkReject(dto.ids);
    return {
      count: uploads.length,
      uploads,
    };
  }
}
