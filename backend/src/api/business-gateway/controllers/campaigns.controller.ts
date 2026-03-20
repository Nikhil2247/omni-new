// ============================================================================
// CAMPAIGNS CONTROLLER - Business Gateway
// ============================================================================
// Vendor campaign management endpoints for ad campaigns and promotions
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { CampaignService } from '../../../domain/subscription/services/campaign.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
  CampaignStatsDto,
  CampaignStatus,
} from '../../../domain/subscription/dto/campaign.dto';

@ApiTags('Vendor Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class CampaignsController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly vendorProfileService: VendorProfileService,
  ) {}

  /**
   * Helper to get and validate vendor profile for current user
   */
  private async getVendorProfileId(userId: string): Promise<string> {
    const profile = await this.vendorProfileService.findByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Vendor profile required');
    }
    return profile.id;
  }

  /**
   * Get vendor's campaigns with optional status filter
   */
  @Get()
  @ApiOperation({ summary: 'Get vendor campaigns' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CampaignStatus,
    description: 'Filter by campaign status',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaigns retrieved successfully',
    type: [CampaignResponseDto],
  })
  async getMyCampaigns(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: CampaignStatus,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    return this.campaignService.getVendorCampaigns(vendorProfileId, status);
  }

  /**
   * Get campaign details by ID
   */
  @Get(':campaignId')
  @ApiOperation({ summary: 'Get campaign details' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign retrieved successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return campaign;
  }

  /**
   * Get campaign statistics
   */
  @Get(':campaignId/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign statistics retrieved successfully',
    type: CampaignStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignStats(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.getStats(campaignId);
  }

  /**
   * Create a new campaign
   */
  @Post()
  @ApiOperation({ summary: 'Create a campaign' })
  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid campaign data' })
  async createCampaign(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateCampaignDto,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    return this.campaignService.create(vendorProfileId, dto);
  }

  /**
   * Update campaign (only DRAFT or SCHEDULED campaigns)
   */
  @Patch(':campaignId')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign updated successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot update campaign in current status' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async updateCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.update(campaignId, dto);
  }

  /**
   * Submit campaign for admin approval
   */
  @Post(':campaignId/submit')
  @ApiOperation({ summary: 'Submit campaign for approval' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign submitted for approval successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot submit campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async submitForApproval(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.submitForApproval(campaignId);
  }

  /**
   * Resubmit rejected campaign for approval
   */
  @Post(':campaignId/resubmit')
  @ApiOperation({ summary: 'Resubmit rejected campaign for approval' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign resubmitted for approval successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot resubmit campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async resubmitForApproval(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.resubmitForApproval(campaignId);
  }

  /**
   * Start a campaign (only APPROVED or SCHEDULED campaigns)
   */
  @Post(':campaignId/start')
  @ApiOperation({ summary: 'Start campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign started successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot start campaign - must be APPROVED first' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async startCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.start(campaignId);
  }

  /**
   * Pause an active campaign
   */
  @Post(':campaignId/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign paused successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot pause campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async pauseCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.pause(campaignId);
  }

  /**
   * Resume a paused campaign
   */
  @Post(':campaignId/resume')
  @ApiOperation({ summary: 'Resume campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign resumed successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot resume campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async resumeCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.resume(campaignId);
  }

  /**
   * Stop/complete a campaign
   */
  @Post(':campaignId/stop')
  @ApiOperation({ summary: 'Stop campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign stopped successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot stop campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async stopCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.stop(campaignId);
  }

  /**
   * Cancel/delete a campaign
   */
  @Delete(':campaignId')
  @ApiOperation({ summary: 'Cancel/delete campaign' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign cancelled successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async cancelCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('campaignId') campaignId: string,
  ) {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const campaign = await this.campaignService.findById(campaignId);

    // Verify ownership
    if (campaign.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.campaignService.cancel(campaignId);
  }
}
