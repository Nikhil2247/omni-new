// ============================================================================
// ADMIN CAMPAIGN CONTROLLER
// ============================================================================
// Admin endpoints for campaign management and approval workflow
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { AuditSensitive } from '../../../core/audit/audit.decorators';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { CampaignService } from '../../../domain/subscription/services/campaign.service';
import {
  CampaignFilterDto,
  RejectCampaignDto,
  AdminCampaignListResponseDto,
  AdminCampaignResponseDto,
  AdminCampaignStatusCountsDto,
  CampaignApprovalResultDto,
} from '../dto/admin-campaign.dto';

@Controller('campaigns')
@ApiTags('Admin Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminCampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  // ============================================================================
  // Campaign Listing Endpoints
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'List all campaigns with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of campaigns',
    type: AdminCampaignListResponseDto,
  })
  async listCampaigns(
    @Query() query: CampaignFilterDto,
  ): Promise<AdminCampaignListResponseDto> {
    const { status, vendorId, type, fromDate, toDate, search, page = 1, limit = 20 } = query;

    const result = await this.campaignService.getAllCampaigns({
      status,
      vendorProfileId: vendorId,
      type,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      search,
      page,
      limit,
    });

    return {
      data: result.campaigns as AdminCampaignResponseDto[],
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: result.totalPages,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @Get('pending')
  @ApiOperation({ summary: 'List campaigns pending approval' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of campaigns awaiting approval',
    type: [AdminCampaignResponseDto],
  })
  async getPendingCampaigns(): Promise<AdminCampaignResponseDto[]> {
    const campaigns = await this.campaignService.getPendingApprovalCampaigns();
    return campaigns as AdminCampaignResponseDto[];
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get campaign counts by status' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of campaigns by status',
    type: AdminCampaignStatusCountsDto,
  })
  async getCampaignCounts(): Promise<Record<string, number>> {
    return this.campaignService.getCampaignCountsByStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  @ApiResponse({
    status: 200,
    description: 'Returns campaign details',
    type: AdminCampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AdminCampaignResponseDto> {
    const campaign = await this.campaignService.findById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign as AdminCampaignResponseDto;
  }

  // ============================================================================
  // Campaign Approval Workflow Endpoints
  // ============================================================================

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a campaign' })
  @ApiResponse({
    status: 200,
    description: 'Campaign approved successfully',
    type: CampaignApprovalResultDto,
  })
  @ApiResponse({ status: 400, description: 'Campaign cannot be approved' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @AuditSensitive('CAMPAIGN_APPROVED', 'Campaign')
  async approveCampaign(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() admin: CurrentUserData,
  ): Promise<CampaignApprovalResultDto> {
    const campaign = await this.campaignService.approveCampaign(id, admin.id);

    return {
      success: true,
      campaign: campaign as AdminCampaignResponseDto,
      message: `Campaign "${campaign.name}" has been approved`,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a campaign' })
  @ApiResponse({
    status: 200,
    description: 'Campaign rejected successfully',
    type: CampaignApprovalResultDto,
  })
  @ApiResponse({ status: 400, description: 'Campaign cannot be rejected' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @AuditSensitive('CAMPAIGN_REJECTED', 'Campaign')
  async rejectCampaign(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: RejectCampaignDto,
    @CurrentUser() admin: CurrentUserData,
  ): Promise<CampaignApprovalResultDto> {
    const campaign = await this.campaignService.rejectCampaign(
      id,
      admin.id,
      dto.reason,
      dto.internalNotes,
    );

    return {
      success: true,
      campaign: campaign as AdminCampaignResponseDto,
      message: `Campaign "${campaign.name}" has been rejected`,
    };
  }

  // ============================================================================
  // Campaign Stats Endpoint
  // ============================================================================

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns campaign statistics',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignStats(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.campaignService.getStats(id);
  }
}
