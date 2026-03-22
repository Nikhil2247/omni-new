// ============================================================================
// ADMIN CLAIM CONTROLLER
// ============================================================================
// Admin endpoints for vendor claim management and approval workflow
// ============================================================================

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { AuditSensitive } from '../../../core/audit/audit.decorators';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { VendorClaimService } from '../../../domain/catalog/services/vendor-claim.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { ClaimStatus } from '@prisma/client';
import {
  ClaimFilterDto,
  ApproveClaimDto,
  RejectClaimDto,
  AdminClaimResponseDto,
  AdminClaimListResponseDto,
  ClaimStatusCountsDto,
  ClaimApprovalResultDto,
} from '../dto/admin-claim.dto';

@Controller('admin/claims')
@ApiTags('Admin - Vendor Claims')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_SYSTEM', 'OPERATIONAL_ADMIN')
export class AdminClaimController {
  constructor(
    private readonly vendorClaimService: VendorClaimService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================================
  // Claim Listing Endpoints
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'List all claims with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of claims',
    type: AdminClaimListResponseDto,
  })
  async getAllClaims(
    @Query() filterDto: ClaimFilterDto,
  ): Promise<AdminClaimListResponseDto> {
    const { status, vendorProfileId, userId, limit = 20, offset = 0 } = filterDto;

    const where: any = {
      ...(status && { status }),
      ...(vendorProfileId && { vendorProfileId }),
      ...(userId && { userId }),
    };

    const [total, claims] = await this.prisma.$transaction([
      this.prisma.vendorClaim.count({ where }),
      this.prisma.vendorClaim.findMany({
        where,
        include: {
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              contactEmail: true,
              contactPhone: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    return {
      claims: claims.map((claim) => this.mapToAdminResponse(claim)),
      total,
      limit,
      offset,
    };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get claims pending review' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of claims awaiting admin review',
    type: [AdminClaimResponseDto],
  })
  async getPendingClaims(): Promise<AdminClaimResponseDto[]> {
    const claims = await this.prisma.vendorClaim.findMany({
      where: {
        status: {
          in: [
            ClaimStatus.PENDING,
            ClaimStatus.VERIFICATION_SENT,
            ClaimStatus.VERIFIED,
          ],
        },
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return claims.map((claim) => this.mapToAdminResponse(claim));
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get claim counts by status' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of claims by status',
    type: ClaimStatusCountsDto,
  })
  async getClaimCounts(): Promise<ClaimStatusCountsDto> {
    const statusCounts = await this.prisma.vendorClaim.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const counts: ClaimStatusCountsDto = {
      pending: 0,
      verificationSent: 0,
      verified: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
    };

    statusCounts.forEach((item) => {
      const count = (item._count as any)?._all ?? 0;
      switch (item.status) {
        case ClaimStatus.PENDING:
          counts.pending = count;
          break;
        case ClaimStatus.VERIFICATION_SENT:
          counts.verificationSent = count;
          break;
        case ClaimStatus.VERIFIED:
          counts.verified = count;
          break;
        case ClaimStatus.APPROVED:
          counts.approved = count;
          break;
        case ClaimStatus.REJECTED:
          counts.rejected = count;
          break;
        case ClaimStatus.EXPIRED:
          counts.expired = count;
          break;
      }
    });

    return counts;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single claim details' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns claim details',
    type: AdminClaimResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async getClaimById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AdminClaimResponseDto> {
    const claim = await this.prisma.vendorClaim.findUnique({
      where: { id },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return this.mapToAdminResponse(claim);
  }

  // ============================================================================
  // Claim Approval Workflow Endpoints
  // ============================================================================

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a vendor claim' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 200,
    description: 'Claim approved successfully',
    type: ClaimApprovalResultDto,
  })
  @ApiResponse({ status: 400, description: 'Claim cannot be approved' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @AuditSensitive('CLAIM_APPROVED', 'VendorClaim')
  async approveClaim(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() admin: CurrentUserData,
    @Body() dto: ApproveClaimDto,
  ): Promise<ClaimApprovalResultDto> {
    const claim = await this.vendorClaimService.approveClaim(
      id,
      admin.id,
      dto.notes,
    );

    // Fetch the full claim with relations for the response
    const fullClaim = await this.prisma.vendorClaim.findUnique({
      where: { id },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      claim: this.mapToAdminResponse(fullClaim || claim),
      message: `Claim has been approved. Vendor profile is now linked to the user.`,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a vendor claim' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 200,
    description: 'Claim rejected successfully',
    type: ClaimApprovalResultDto,
  })
  @ApiResponse({ status: 400, description: 'Claim cannot be rejected' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @AuditSensitive('CLAIM_REJECTED', 'VendorClaim')
  async rejectClaim(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() admin: CurrentUserData,
    @Body() dto: RejectClaimDto,
  ): Promise<ClaimApprovalResultDto> {
    const claim = await this.vendorClaimService.rejectClaim(
      id,
      admin.id,
      dto.reason,
    );

    // Fetch the full claim with relations for the response
    const fullClaim = await this.prisma.vendorClaim.findUnique({
      where: { id },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      claim: this.mapToAdminResponse(fullClaim || claim),
      message: `Claim has been rejected.`,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapToAdminResponse(claim: any): AdminClaimResponseDto {
    return {
      id: claim.id,
      vendorProfileId: claim.vendorProfileId,
      userId: claim.userId,
      status: claim.status,
      verificationMethod: claim.verificationMethod,
      verificationExpiry: claim.verificationExpiry,
      reviewedBy: claim.reviewedBy,
      reviewedAt: claim.reviewedAt,
      reviewNotes: claim.reviewNotes,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
      vendorProfile: claim.vendorProfile
        ? {
            id: claim.vendorProfile.id,
            businessName: claim.vendorProfile.businessName,
            slug: claim.vendorProfile.slug,
            contactEmail: claim.vendorProfile.contactEmail,
            contactPhone: claim.vendorProfile.contactPhone,
            status: claim.vendorProfile.status,
          }
        : undefined,
      user: claim.user
        ? {
            id: claim.user.id,
            email: claim.user.email,
            firstName: claim.user.firstName,
            lastName: claim.user.lastName,
          }
        : undefined,
    };
  }
}
