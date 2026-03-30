// ============================================================================
// MARKETING CAMPAIGNS CONTROLLER
// ============================================================================
// Marketing team endpoints for campaign management and approval workflow
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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { MarketingAccess } from '../../../core/auth/decorators/roles.decorator';
import { AuditSensitive } from '../../../core/audit/audit.decorators';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { CampaignService } from '../../../domain/subscription/services/campaign.service';
import {
  MarketingCampaignFilterDto,
  RejectCampaignDto,
  BulkCampaignIdsDto,
  BulkRejectCampaignsDto,
  MarketingCampaignListResponseDto,
  MarketingCampaignResponseDto,
  MarketingCampaignStatusCountsDto,
  CampaignApprovalResultDto,
  BulkOperationResultDto,
  CampaignPerformanceDto,
} from '../dto/marketing-campaign.dto';

@Controller('campaigns')
@ApiTags('Marketing Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@MarketingAccess()
export class CampaignsController {
  private readonly logger = new Logger(CampaignsController.name);

  constructor(private readonly campaignService: CampaignService) {}

  // ============================================================================
  // Campaign Listing Endpoints
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'List all campaigns with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of campaigns',
    type: MarketingCampaignListResponseDto,
  })
  async listCampaigns(
    @Query() query: MarketingCampaignFilterDto,
  ): Promise<MarketingCampaignListResponseDto> {
    const {
      status,
      vendorId,
      type,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = query;

    this.logger.log(
      `Marketing team listing campaigns with filters: ${JSON.stringify(query)}`,
    );

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
      data: result.campaigns as MarketingCampaignResponseDto[],
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
    type: [MarketingCampaignResponseDto],
  })
  async getPendingCampaigns(): Promise<MarketingCampaignResponseDto[]> {
    this.logger.log('Marketing team fetching pending approval campaigns');
    const campaigns = await this.campaignService.getPendingApprovalCampaigns();
    return campaigns as MarketingCampaignResponseDto[];
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get campaign counts by status' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of campaigns by status',
    type: MarketingCampaignStatusCountsDto,
  })
  async getCampaignCounts(): Promise<Record<string, number>> {
    this.logger.log('Marketing team fetching campaign status counts');
    return this.campaignService.getCampaignCountsByStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  @ApiResponse({
    status: 200,
    description: 'Returns campaign details',
    type: MarketingCampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MarketingCampaignResponseDto> {
    this.logger.log(`Marketing team fetching campaign details: ${id}`);
    const campaign = await this.campaignService.findById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign as MarketingCampaignResponseDto;
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns campaign statistics and metrics',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignStats(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    this.logger.log(`Marketing team fetching campaign stats: ${id}`);
    return this.campaignService.getStats(id);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get detailed campaign performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed campaign performance data',
    type: CampaignPerformanceDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignPerformance(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CampaignPerformanceDto> {
    this.logger.log(`Marketing team fetching campaign performance: ${id}`);

    // Get campaign stats which includes all performance data
    const stats = await this.campaignService.getStats(id);

    // Get campaign details for vendor info
    const campaign = await this.campaignService.findById(id);

    return {
      campaignId: stats.campaignId,
      name: stats.name,
      type: stats.type,
      status: stats.status,
      impressions: stats.impressions,
      clicks: stats.clicks,
      conversions: stats.conversions,
      creditsSpent: stats.creditsSpent,
      totalBudget: stats.totalBudget,
      dailyBudget: stats.dailyBudget,
      remainingBudget: stats.remainingBudget,
      ctr: stats.ctr,
      conversionRate: stats.conversionRate,
      costPerClick: stats.costPerClick,
      costPerConversion: stats.costPerConversion,
      budgetUtilization: stats.budgetUtilization,
      startDate: stats.startDate,
      endDate: stats.endDate,
      dailyStats: stats.dailyStats,
      vendorProfile: (campaign as any).vendorProfile,
    };
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
    @CurrentUser() user: CurrentUserData,
  ): Promise<CampaignApprovalResultDto> {
    this.logger.log(
      `Marketing user ${user.id} approving campaign: ${id}`,
    );

    const campaign = await this.campaignService.approveCampaign(id, user.id);

    return {
      success: true,
      campaign: campaign as MarketingCampaignResponseDto,
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
    @CurrentUser() user: CurrentUserData,
  ): Promise<CampaignApprovalResultDto> {
    this.logger.log(
      `Marketing user ${user.id} rejecting campaign: ${id}`,
    );

    const campaign = await this.campaignService.rejectCampaign(
      id,
      user.id,
      dto.reason,
      dto.internalNotes,
    );

    return {
      success: true,
      campaign: campaign as MarketingCampaignResponseDto,
      message: `Campaign "${campaign.name}" has been rejected`,
    };
  }

  // ============================================================================
  // Bulk Operations Endpoints
  // ============================================================================

  @Post('bulk/approve')
  @ApiOperation({ summary: 'Approve multiple campaigns at once' })
  @ApiResponse({
    status: 200,
    description: 'Bulk approval results',
    type: BulkOperationResultDto,
  })
  @AuditSensitive('CAMPAIGNS_BULK_APPROVED', 'Campaign')
  async bulkApproveCampaigns(
    @Body() dto: BulkCampaignIdsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<BulkOperationResultDto> {
    this.logger.log(
      `Marketing user ${user.id} bulk approving ${dto.campaignIds.length} campaigns`,
    );

    const results: Array<{
      campaignId: string;
      success: boolean;
      message?: string;
      campaign?: MarketingCampaignResponseDto;
    }> = [];

    let succeeded = 0;
    let failed = 0;

    for (const campaignId of dto.campaignIds) {
      try {
        const campaign = await this.campaignService.approveCampaign(
          campaignId,
          user.id,
        );
        results.push({
          campaignId,
          success: true,
          message: `Campaign "${campaign.name}" approved`,
          campaign: campaign as MarketingCampaignResponseDto,
        });
        succeeded++;
      } catch (error) {
        results.push({
          campaignId,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    this.logger.log(
      `Bulk approve completed: ${succeeded} succeeded, ${failed} failed`,
    );

    return {
      success: failed === 0,
      total: dto.campaignIds.length,
      succeeded,
      failed,
      results,
    };
  }

  @Post('bulk/reject')
  @ApiOperation({ summary: 'Reject multiple campaigns at once' })
  @ApiResponse({
    status: 200,
    description: 'Bulk rejection results',
    type: BulkOperationResultDto,
  })
  @AuditSensitive('CAMPAIGNS_BULK_REJECTED', 'Campaign')
  async bulkRejectCampaigns(
    @Body() dto: BulkRejectCampaignsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<BulkOperationResultDto> {
    this.logger.log(
      `Marketing user ${user.id} bulk rejecting ${dto.campaignIds.length} campaigns`,
    );

    const results: Array<{
      campaignId: string;
      success: boolean;
      message?: string;
      campaign?: MarketingCampaignResponseDto;
    }> = [];

    let succeeded = 0;
    let failed = 0;

    for (const campaignId of dto.campaignIds) {
      try {
        const campaign = await this.campaignService.rejectCampaign(
          campaignId,
          user.id,
          dto.reason,
          dto.internalNotes,
        );
        results.push({
          campaignId,
          success: true,
          message: `Campaign "${campaign.name}" rejected`,
          campaign: campaign as MarketingCampaignResponseDto,
        });
        succeeded++;
      } catch (error) {
        results.push({
          campaignId,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    this.logger.log(
      `Bulk reject completed: ${succeeded} succeeded, ${failed} failed`,
    );

    return {
      success: failed === 0,
      total: dto.campaignIds.length,
      succeeded,
      failed,
      results,
    };
  }
}
