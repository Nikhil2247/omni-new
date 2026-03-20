// ============================================================================
// BUSINESS GATEWAY - KYC Controller
// ============================================================================
// Vendor KYC management endpoints for business users
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
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
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { KycVerificationService } from '../../../domain/operations/services/kyc-verification.service';
import { KycDocumentService } from '../../../domain/operations/services/kyc-document.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import {
  CreateVendorKYCDto,
  UpdateVendorKYCDto,
  VendorKYCResponseDto,
} from '../../../domain/operations/dto/vendor-kyc.dto';
import {
  DocumentType,
  KYCDocumentResponseDto,
} from '../../../domain/operations/dto/kyc-document.dto';
import {
  AuditCreate,
  AuditSensitive,
} from '../../../core/audit/audit.decorators';

@ApiTags('Business - KYC Verification')
@ApiBearerAuth()
@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KycController {
  constructor(
    private readonly kycService: KycVerificationService,
    private readonly kycDocumentService: KycDocumentService,
    private readonly vendorProfileService: VendorProfileService,
  ) {}

  // ============================================================================
  // KYC RECORD MANAGEMENT
  // ============================================================================

  /**
   * Get or create KYC record for current vendor
   */
  @Get('me')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get own KYC record with documents' })
  @ApiResponse({ status: 200, description: 'KYC record retrieved' })
  @ApiResponse({ status: 404, description: 'No KYC record found' })
  async getMyKyc(@Request() req: any): Promise<VendorKYCResponseDto & { documents: KYCDocumentResponseDto[] }> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const kyc = await this.kycService.findByVendorProfile(profile.id);

    if (!kyc) {
      throw new NotFoundException('No KYC record found. Please create one first.');
    }

    return kyc as any;
  }

  /**
   * Create or update KYC business details
   */
  @Post('me')
  @Roles('BUSINESS_ADMIN')
  @AuditCreate('VendorKYC')
  @ApiOperation({ summary: 'Create or update KYC business details' })
  @ApiResponse({ status: 201, description: 'KYC record created/updated' })
  async createOrUpdateKyc(
    @Body() dto: Omit<CreateVendorKYCDto, 'vendorProfileId'>,
    @Request() req: any,
  ): Promise<VendorKYCResponseDto> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);

    // Check if KYC already exists
    const existingKyc = await this.kycService.findByVendorProfile(profile.id);

    if (existingKyc) {
      // Update existing KYC if in PENDING or REJECTED status
      if (existingKyc.status !== 'PENDING' && existingKyc.status !== 'REJECTED') {
        throw new BadRequestException(
          'Cannot update KYC that is already submitted or approved',
        );
      }
      return this.kycService.update(existingKyc.id, dto as UpdateVendorKYCDto);
    }

    // Create new KYC
    return this.kycService.createWithDetails(profile.id, dto);
  }

  /**
   * Submit KYC for review
   */
  @Post('me/submit')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('SUBMIT', 'VendorKYC')
  @ApiOperation({ summary: 'Submit KYC for verification review' })
  @ApiResponse({ status: 200, description: 'KYC submitted for review' })
  @ApiResponse({ status: 400, description: 'Cannot submit KYC' })
  async submitKyc(@Request() req: any): Promise<VendorKYCResponseDto> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const kyc = await this.kycService.findByVendorProfile(profile.id);

    if (!kyc) {
      throw new NotFoundException('No KYC record found');
    }

    return this.kycService.submit(kyc.id);
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Upload a KYC document
   */
  @Post('me/documents')
  @Roles('BUSINESS_ADMIN')
  @AuditCreate('KYCDocument')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a KYC document' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, JPEG, PNG)',
        },
        type: {
          type: 'string',
          enum: Object.values(DocumentType),
          description: 'Document type',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the document',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or document type' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: DocumentType,
    @Body('notes') notes: string | undefined,
    @Request() req: any,
  ): Promise<KYCDocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!type || !Object.values(DocumentType).includes(type)) {
      throw new BadRequestException('Invalid document type');
    }

    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    let kyc = await this.kycService.findByVendorProfile(profile.id);

    // Auto-create KYC record if it doesn't exist
    if (!kyc) {
      kyc = await this.kycService.create(profile.id);
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: PDF, JPEG, PNG, WebP',
      );
    }

    return this.kycDocumentService.upload(
      kyc.id,
      type,
      file.buffer,
      file.originalname,
      file.mimetype,
      notes,
    );
  }

  /**
   * Get all documents for current vendor's KYC
   */
  @Get('me/documents')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get all KYC documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved' })
  async getMyDocuments(@Request() req: any): Promise<KYCDocumentResponseDto[]> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const kyc = await this.kycService.findByVendorProfile(profile.id);

    if (!kyc) {
      return [];
    }

    return this.kycDocumentService.findByKycId(kyc.id);
  }

  /**
   * Delete a KYC document (only if KYC is in PENDING or REJECTED status)
   */
  @Put('me/documents/:documentId/delete')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('DELETE', 'KYCDocument')
  @ApiOperation({ summary: 'Delete a KYC document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete document' })
  async deleteDocument(
    @Param('documentId') documentId: string,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const kyc = await this.kycService.findByVendorProfile(profile.id);

    if (!kyc) {
      throw new NotFoundException('No KYC record found');
    }

    // Only allow deletion if KYC is in PENDING or REJECTED status
    if (kyc.status !== 'PENDING' && kyc.status !== 'REJECTED') {
      throw new BadRequestException(
        'Cannot delete documents when KYC is under review or approved',
      );
    }

    await this.kycDocumentService.delete(documentId, kyc.id);
    return { success: true };
  }

  // ============================================================================
  // STATUS & INFO
  // ============================================================================

  /**
   * Get required document types
   */
  @Get('document-types')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get list of document types and requirements' })
  @ApiResponse({ status: 200, description: 'Document types retrieved' })
  getDocumentTypes() {
    return {
      required: [
        {
          type: DocumentType.BUSINESS_LICENSE,
          name: 'Business License',
          description: 'Your business registration certificate or license',
          required: true,
        },
        {
          type: DocumentType.ID_DOCUMENT,
          name: 'ID Document',
          description: 'Government-issued photo ID (passport, driver\'s license, etc.)',
          required: true,
        },
      ],
      optional: [
        {
          type: DocumentType.TAX_CERTIFICATE,
          name: 'Tax Certificate',
          description: 'GST/Tax registration certificate',
          required: false,
        },
        {
          type: DocumentType.INSURANCE,
          name: 'Insurance',
          description: 'Business liability insurance certificate',
          required: false,
        },
        {
          type: DocumentType.ADDRESS_PROOF,
          name: 'Address Proof',
          description: 'Utility bill or bank statement showing business address',
          required: false,
        },
        {
          type: DocumentType.OTHER,
          name: 'Other',
          description: 'Any other supporting documents',
          required: false,
        },
      ],
    };
  }
}
