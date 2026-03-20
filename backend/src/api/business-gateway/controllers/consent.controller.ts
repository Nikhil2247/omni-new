// ============================================================================
// BUSINESS GATEWAY - Consent Controller
// ============================================================================
// Vendor consent management - view, give, withdraw consents

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { ConsentType } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { ConsentService } from '../../../domain/operations/services/consent.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import { AuditSensitive } from '../../../core/audit/audit.decorators';

class GiveConsentDto {
  @ApiProperty({ enum: ConsentType })
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty()
  @IsString()
  version: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

class WithdrawConsentDto {
  @ApiProperty({ enum: ConsentType })
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty()
  @IsString()
  version: string;
}

class BulkConsentDto {
  @ApiProperty({ type: [GiveConsentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => GiveConsentDto)
  consents: GiveConsentDto[];
}

@ApiTags('Business - Consent Management')
@ApiBearerAuth()
@Controller('consents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly vendorProfileService: VendorProfileService,
  ) {}

  /**
   * Get all consents for vendor
   */
  @Get('me')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get all vendor consents' })
  @ApiResponse({ status: 200, description: 'Consents retrieved' })
  async getMyConsents(@Request() req: any) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const consents = await this.consentService.getVendorConsents(profile.id);

    return { consents };
  }

  /**
   * Get consent status for all types
   */
  @Get('me/status')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get consent status for all types' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getConsentStatus(@Request() req: any) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const status = await this.consentService.getVendorConsentStatus(profile.id);
    const required = await this.consentService.hasRequiredVendorConsents(profile.id);

    return {
      status,
      required: {
        hasAll: required.hasAll,
        missing: required.missing,
      },
    };
  }

  /**
   * Give a consent
   */
  @Post('me/give')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('GIVE_CONSENT', 'VendorConsent')
  @ApiOperation({ summary: 'Give a consent' })
  @ApiResponse({ status: 201, description: 'Consent recorded' })
  async giveConsent(
    @Body() dto: GiveConsentDto,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);

    const consent = await this.consentService.giveVendorConsent(profile.id, {
      consentType: dto.consentType,
      version: dto.version,
      documentUrl: dto.documentUrl,
      ipAddress: ip,
      userAgent,
      source: 'business-dashboard',
    });

    return { success: true, consent };
  }

  /**
   * Give multiple consents at once (onboarding)
   */
  @Post('me/bulk')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('GIVE_CONSENT_BULK', 'VendorConsent')
  @ApiOperation({ summary: 'Give multiple consents at once' })
  @ApiResponse({ status: 201, description: 'Consents recorded' })
  async giveConsentsBulk(
    @Body() dto: BulkConsentDto,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);

    const consents = await this.consentService.giveVendorConsentsBulk(
      profile.id,
      dto.consents.map((c) => ({
        ...c,
        ipAddress: ip,
        userAgent,
        source: 'business-onboarding',
      })),
    );

    return { success: true, consents };
  }

  /**
   * Withdraw a consent
   */
  @Post('me/withdraw')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('WITHDRAW_CONSENT', 'VendorConsent')
  @ApiOperation({ summary: 'Withdraw a consent' })
  @ApiResponse({ status: 200, description: 'Consent withdrawn' })
  async withdrawConsent(
    @Body() dto: WithdrawConsentDto,
    @Request() req: any,
  ) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);

    // Check if this is a required consent
    const requiredTypes: ConsentType[] = [
      ConsentType.TERMS_OF_SERVICE,
      ConsentType.PRIVACY_POLICY,
      ConsentType.PLATFORM_COMMISSION,
    ];

    if (requiredTypes.includes(dto.consentType)) {
      return {
        success: false,
        message: 'Cannot withdraw required consents. Contact support if you wish to close your account.',
      };
    }

    const consent = await this.consentService.withdrawVendorConsent(
      profile.id,
      dto.consentType,
      dto.version,
    );

    return { success: true, consent };
  }

  /**
   * Get required consent types
   * Returns consent definitions from database if available, otherwise fallback to hardcoded
   */
  @Get('types/required')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get required consent types for vendors' })
  @ApiResponse({ status: 200, description: 'Types retrieved' })
  async getRequiredTypes() {
    // Try to get from database first
    const definitions = await this.consentService.getVendorConsentDefinitions();

    if (definitions && definitions.length > 0) {
      return {
        required: definitions
          .filter((d) => d.isRequired)
          .map((d) => ({
            type: d.type,
            name: d.title,
            description: d.description || '',
            version: d.version,
            documentUrl: d.documentUrl,
            content: d.content,
            summary: d.summary,
          })),
        optional: definitions
          .filter((d) => !d.isRequired)
          .map((d) => ({
            type: d.type,
            name: d.title,
            description: d.description || '',
            version: d.version,
            documentUrl: d.documentUrl,
            content: d.content,
            summary: d.summary,
          })),
      };
    }

    // Fallback to hardcoded if no definitions in database
    return {
      required: [
        {
          type: ConsentType.TERMS_OF_SERVICE,
          name: 'Terms of Service',
          description: 'Agreement to platform terms and conditions',
        },
        {
          type: ConsentType.PRIVACY_POLICY,
          name: 'Privacy Policy',
          description: 'Acknowledgment of how we handle your data',
        },
        {
          type: ConsentType.PLATFORM_COMMISSION,
          name: 'Platform Commission',
          description: 'Agreement to commission deduction on bookings',
        },
        {
          type: ConsentType.DATA_PROCESSING,
          name: 'Data Processing',
          description: 'Consent for data processing as per GDPR',
        },
      ],
      optional: [
        {
          type: ConsentType.MARKETING_EMAIL,
          name: 'Email Marketing',
          description: 'Receive promotional emails and updates',
        },
        {
          type: ConsentType.MARKETING_SMS,
          name: 'SMS Marketing',
          description: 'Receive promotional SMS messages',
        },
      ],
    };
  }
}
