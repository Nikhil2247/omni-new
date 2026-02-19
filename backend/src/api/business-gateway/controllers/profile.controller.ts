// ============================================================================
// BUSINESS GATEWAY - Profile Controller
// ============================================================================
// Vendor profile management endpoints for business users
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import {
  CreateVendorProfileDto,
  UpdateVendorProfileDto,
  VendorProfileResponseDto,
} from '../../../domain/catalog/dto/vendor-profile.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import {
  AuditCreate,
  Audited,
  AuditSensitive,
} from '../../../core/audit/audit.decorators';
import { AuditSeverity } from '../../../core/audit/audit.types';

@ApiTags('Business - Profile Management')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly vendorProfileService: VendorProfileService) {}

  /**
   * Create vendor profile for current user
   */
  @Post()
  @Roles('BUSINESS_ADMIN')
  @AuditCreate('VendorProfile')
  @ApiOperation({ summary: 'Create vendor profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async create(
    @Body() dto: CreateVendorProfileDto,
    @Request() req: any,
  ): Promise<VendorProfileResponseDto> {
    // Override userId with authenticated user
    dto.userId = req.user.id;
    return this.vendorProfileService.create(dto);
  }

  /**
   * Get own vendor profile
   */
  @Get('me')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get own vendor profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@Request() req: any): Promise<VendorProfileResponseDto> {
    return this.vendorProfileService.findByUserId(req.user.id);
  }

  /**
   * Update own vendor profile
   */
  @Put('me')
  @Roles('BUSINESS_ADMIN')
  @Audited({
    action: 'UPDATE',
    entityType: 'VendorProfile',
    getEntityId: (_req, res) => res?.id,
    includeRequestBody: true,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  @ApiOperation({ summary: 'Update own vendor profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateMyProfile(
    @Body() dto: UpdateVendorProfileDto,
    @Request() req: any,
  ): Promise<VendorProfileResponseDto> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    return this.vendorProfileService.update(profile.id, dto);
  }

  /**
   * Delete own vendor profile
   */
  @Delete('me')
  @Roles('BUSINESS_ADMIN')
  @Audited({
    action: 'DELETE',
    entityType: 'VendorProfile',
    getEntityId: (req) => req.user?.id,
    includeRequestBody: false,
    includeResponseBody: false,
    severity: AuditSeverity.WARNING,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own vendor profile' })
  @ApiResponse({ status: 204, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async deleteMyProfile(@Request() req: any): Promise<void> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    await this.vendorProfileService.delete(profile.id);
  }

  /**
   * Submit profile for verification
   */
  @Post('me/verify')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('SUBMIT_VERIFICATION', 'VendorProfile')
  @ApiOperation({ summary: 'Submit profile for verification' })
  @ApiResponse({
    status: 200,
    description: 'Profile submitted for verification',
  })
  @ApiResponse({ status: 400, description: 'Profile cannot be submitted' })
  async submitForVerification(
    @Request() req: any,
  ): Promise<VendorProfileResponseDto> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    return this.vendorProfileService.submitForVerification(profile.id);
  }

  /**
   * Generate unique slug from business name
   */
  @Post('generate-slug')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Generate unique slug from business name' })
  @ApiResponse({ status: 200, description: 'Slug generated successfully' })
  async generateSlug(
    @Body('businessName') businessName: string,
  ): Promise<{ slug: string }> {
    const slug = await this.vendorProfileService.generateSlug(businessName);
    return { slug };
  }

  /**
   * Upload profile photo
   */
  @Post('me/photo')
  @Roles('BUSINESS_ADMIN')
  @Audited({
    action: 'UPLOAD_PHOTO',
    entityType: 'VendorProfile',
    getEntityId: (_req, res) => res?.id,
    includeRequestBody: false,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile photo file (JPEG, PNG, WebP)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<VendorProfileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    return this.vendorProfileService.uploadProfilePhoto(
      profile.id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  /**
   * Delete profile photo
   */
  @Delete('me/photo')
  @Roles('BUSINESS_ADMIN')
  @Audited({
    action: 'DELETE_PHOTO',
    entityType: 'VendorProfile',
    getEntityId: (_req, res) => res?.id,
    includeRequestBody: false,
    includeResponseBody: false,
    severity: AuditSeverity.INFO,
  })
  @ApiOperation({ summary: 'Delete profile photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  async deleteProfilePhoto(
    @Request() req: any,
  ): Promise<VendorProfileResponseDto> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    return this.vendorProfileService.deleteProfilePhoto(profile.id);
  }
}
