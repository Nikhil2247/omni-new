// ============================================================================
// CAMPAIGN SERVICE - Subscription Domain
// ============================================================================
// Manages advertising campaigns: lifecycle, metrics, and spend tracking
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CampaignRepository } from '../repositories/campaign.repository';
import { AdCreditService } from './ad-credit.service';
import { Campaign, CampaignStatus, CampaignType } from '@prisma/client';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignStatsDto,
} from '../dto/campaign.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly adCreditService: AdCreditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // Campaign CRUD
  // ============================================================================

  /**
   * Create a new campaign
   */
  async create(
    vendorProfileId: string,
    dto: CreateCampaignDto,
  ): Promise<Campaign> {
    this.logger.log(`Creating campaign for vendor ${vendorProfileId}`);

    // Validate budget
    if (dto.dailyBudget > dto.totalBudget) {
      throw new BadRequestException(
        'Daily budget cannot exceed total budget',
      );
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    // Compare only dates (not time) - allow today as a valid start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateOnly = new Date(startDate);
    startDateOnly.setHours(0, 0, 0, 0);

    if (startDateOnly < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (endDate && endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check if vendor has enough credits for at least one day
    const canAfford = await this.adCreditService.canAfford(
      vendorProfileId,
      dto.dailyBudget,
    );
    if (!canAfford) {
      throw new BadRequestException(
        'Insufficient credits for campaign daily budget',
      );
    }

    // Auto-approve campaigns - set to ACTIVE if starting today, otherwise SCHEDULED
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const status = startDateOnly.getTime() === now.getTime()
      ? CampaignStatus.ACTIVE
      : CampaignStatus.SCHEDULED;

    const campaign = await this.campaignRepository.create({
      vendorProfile: { connect: { id: vendorProfileId } },
      type: dto.type as CampaignType,
      name: dto.name,
      description: dto.description,
      targetEntityId: dto.targetEntityId,
      targetEntityType: dto.targetEntityType,
      dailyBudget: dto.dailyBudget,
      totalBudget: dto.totalBudget,
      startDate,
      endDate,
      status,
    });

    this.eventEmitter.emit('campaign.created', {
      campaignId: campaign.id,
      vendorProfileId,
      type: campaign.type,
      status: campaign.status,
    });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async findById(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(campaignId, {
      vendorProfile: true,
      dailyStats: {
        take: 30,
        orderBy: { date: 'desc' },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Update campaign
   */
  async update(
    campaignId: string,
    dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    // Only allow updates to DRAFT or SCHEDULED campaigns
    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Cannot update campaign that is not in DRAFT or SCHEDULED status',
      );
    }

    return this.campaignRepository.update(campaignId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.dailyBudget && { dailyBudget: dto.dailyBudget }),
      ...(dto.totalBudget && { totalBudget: dto.totalBudget }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      ...(dto.targetEntityId !== undefined && { targetEntityId: dto.targetEntityId }),
      ...(dto.targetEntityType !== undefined && { targetEntityType: dto.targetEntityType }),
    });
  }

  /**
   * Delete a campaign (only DRAFT or CANCELLED)
   */
  async delete(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Can only delete DRAFT or CANCELLED campaigns',
      );
    }

    return this.campaignRepository.delete(campaignId);
  }

  // ============================================================================
  // Campaign Approval Workflow
  // ============================================================================

  /**
   * Submit a campaign for admin approval
   * Changes status from DRAFT to PENDING_APPROVAL
   */
  async submitForApproval(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT campaigns can be submitted for approval',
      );
    }

    this.logger.log(`Submitting campaign ${campaignId} for approval`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
    });

    this.eventEmitter.emit('campaign.submitted-for-approval', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      name: campaign.name,
      type: campaign.type,
    });

    return updatedCampaign;
  }

  /**
   * Approve a campaign (Admin action)
   * Changes status from PENDING_APPROVAL to APPROVED
   */
  async approveCampaign(campaignId: string, adminId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (campaign.status !== CampaignStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only PENDING_APPROVAL campaigns can be approved',
      );
    }

    this.logger.log(`Admin ${adminId} approving campaign ${campaignId}`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.APPROVED,
      approvedBy: { connect: { id: adminId } },
      approvedAt: new Date(),
      // Clear any previous rejection data
      rejectedBy: { disconnect: true },
      rejectedAt: null,
      rejectionReason: null,
    });

    this.eventEmitter.emit('campaign.approved', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      adminId,
      name: campaign.name,
      type: campaign.type,
    });

    return updatedCampaign;
  }

  /**
   * Reject a campaign (Admin action)
   * Changes status from PENDING_APPROVAL to REJECTED
   */
  async rejectCampaign(
    campaignId: string,
    adminId: string,
    reason: string,
    internalNotes?: string,
  ): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (campaign.status !== CampaignStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only PENDING_APPROVAL campaigns can be rejected',
      );
    }

    this.logger.log(`Admin ${adminId} rejecting campaign ${campaignId}: ${reason}`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.REJECTED,
      rejectedBy: { connect: { id: adminId } },
      rejectedAt: new Date(),
      rejectionReason: reason,
      internalNotes,
      // Clear any previous approval data
      approvedBy: { disconnect: true },
      approvedAt: null,
    });

    this.eventEmitter.emit('campaign.rejected', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      adminId,
      reason,
      name: campaign.name,
      type: campaign.type,
    });

    return updatedCampaign;
  }

  /**
   * Resubmit a rejected campaign for approval
   * Changes status from REJECTED back to PENDING_APPROVAL
   */
  async resubmitForApproval(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (campaign.status !== CampaignStatus.REJECTED) {
      throw new BadRequestException(
        'Only REJECTED campaigns can be resubmitted for approval',
      );
    }

    this.logger.log(`Resubmitting campaign ${campaignId} for approval`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
    });

    this.eventEmitter.emit('campaign.resubmitted-for-approval', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      name: campaign.name,
      type: campaign.type,
    });

    return updatedCampaign;
  }

  // ============================================================================
  // Campaign Lifecycle
  // ============================================================================

  /**
   * Start a campaign (check credits, set ACTIVE)
   * Can only start APPROVED or SCHEDULED campaigns
   */
  async start(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (
      campaign.status !== CampaignStatus.APPROVED &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Campaign must be in APPROVED or SCHEDULED status to start',
      );
    }

    // Verify vendor has sufficient credits
    const canAfford = await this.adCreditService.canAfford(
      campaign.vendorProfileId,
      campaign.dailyBudget,
    );
    if (!canAfford) {
      throw new BadRequestException(
        'Insufficient credits to start campaign',
      );
    }

    this.logger.log(`Starting campaign ${campaignId}`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.ACTIVE,
    });

    this.eventEmitter.emit('campaign.started', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      type: campaign.type,
    });

    return updatedCampaign;
  }

  /**
   * Pause a campaign
   */
  async pause(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        'Only ACTIVE campaigns can be paused',
      );
    }

    this.logger.log(`Pausing campaign ${campaignId}`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.PAUSED,
    });

    this.eventEmitter.emit('campaign.paused', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
    });

    return updatedCampaign;
  }

  /**
   * Resume a paused campaign
   */
  async resume(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException(
        'Only PAUSED campaigns can be resumed',
      );
    }

    // Check if campaign hasn't expired
    if (campaign.endDate && new Date(campaign.endDate) < new Date()) {
      throw new BadRequestException(
        'Cannot resume campaign that has passed its end date',
      );
    }

    // Verify vendor has sufficient credits
    const canAfford = await this.adCreditService.canAfford(
      campaign.vendorProfileId,
      campaign.dailyBudget,
    );
    if (!canAfford) {
      throw new BadRequestException(
        'Insufficient credits to resume campaign',
      );
    }

    this.logger.log(`Resuming campaign ${campaignId}`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.ACTIVE,
    });

    this.eventEmitter.emit('campaign.resumed', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
    });

    return updatedCampaign;
  }

  /**
   * Stop/complete a campaign
   */
  async stop(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (
      campaign.status !== CampaignStatus.ACTIVE &&
      campaign.status !== CampaignStatus.PAUSED
    ) {
      throw new BadRequestException(
        'Only ACTIVE or PAUSED campaigns can be stopped',
      );
    }

    this.logger.log(`Stopping campaign ${campaignId}`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.COMPLETED,
    });

    this.eventEmitter.emit('campaign.completed', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      totalCreditsSpent: campaign.creditsSpent,
      totalImpressions: campaign.impressions,
      totalClicks: campaign.clicks,
      totalConversions: campaign.conversions,
    });

    return updatedCampaign;
  }

  /**
   * Cancel a campaign
   */
  async cancel(campaignId: string): Promise<Campaign> {
    const campaign = await this.findById(campaignId);

    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot cancel a completed campaign',
      );
    }

    this.logger.log(`Cancelling campaign ${campaignId}`);

    const updatedCampaign = await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.CANCELLED,
    });

    this.eventEmitter.emit('campaign.cancelled', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
    });

    return updatedCampaign;
  }

  // ============================================================================
  // Metrics Recording
  // ============================================================================

  /**
   * Record an impression (called by search/display services)
   */
  async recordImpression(campaignId: string): Promise<void> {
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
      return; // Silently ignore for non-active campaigns
    }

    await Promise.all([
      this.campaignRepository.incrementMetrics(campaignId, {
        impressions: 1,
      }),
      this.campaignRepository.incrementDailyMetrics(campaignId, new Date(), {
        impressions: 1,
      }),
    ]);
  }

  /**
   * Record a click
   */
  async recordClick(campaignId: string): Promise<void> {
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
      return;
    }

    await Promise.all([
      this.campaignRepository.incrementMetrics(campaignId, {
        clicks: 1,
      }),
      this.campaignRepository.incrementDailyMetrics(campaignId, new Date(), {
        clicks: 1,
      }),
    ]);

    this.eventEmitter.emit('campaign.click', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      type: campaign.type,
    });
  }

  /**
   * Record a conversion
   */
  async recordConversion(campaignId: string): Promise<void> {
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
      return;
    }

    await Promise.all([
      this.campaignRepository.incrementMetrics(campaignId, {
        conversions: 1,
      }),
      this.campaignRepository.incrementDailyMetrics(campaignId, new Date(), {
        conversions: 1,
      }),
    ]);

    this.eventEmitter.emit('campaign.conversion', {
      campaignId,
      vendorProfileId: campaign.vendorProfileId,
      type: campaign.type,
    });
  }

  // ============================================================================
  // Daily Processing (Called by Scheduler)
  // ============================================================================

  /**
   * Process daily spend for all active campaigns
   */
  async processDailySpend(): Promise<{
    processed: number;
    charged: number;
    paused: number;
    completed: number;
  }> {
    this.logger.log('Processing daily campaign spend...');

    const activeCampaigns = await this.campaignRepository.findActive({
      vendorProfile: true,
    });

    let processed = 0;
    let charged = 0;
    let paused = 0;
    let completed = 0;

    for (const campaign of activeCampaigns) {
      processed++;

      try {
        // Check if campaign has exhausted total budget
        const remainingBudget = campaign.totalBudget - campaign.creditsSpent;
        const dailySpend = Math.min(campaign.dailyBudget, remainingBudget);

        if (dailySpend <= 0) {
          // Campaign budget exhausted, mark as completed
          await this.campaignRepository.update(campaign.id, {
            status: CampaignStatus.COMPLETED,
          });
          completed++;
          this.eventEmitter.emit('campaign.budget-exhausted', {
            campaignId: campaign.id,
            vendorProfileId: campaign.vendorProfileId,
          });
          continue;
        }

        // Check if vendor can afford daily spend
        const canAfford = await this.adCreditService.canAfford(
          campaign.vendorProfileId,
          dailySpend,
        );

        if (!canAfford) {
          // Pause campaign due to insufficient credits
          await this.campaignRepository.update(campaign.id, {
            status: CampaignStatus.PAUSED,
          });
          paused++;
          this.eventEmitter.emit('campaign.insufficient-credits', {
            campaignId: campaign.id,
            vendorProfileId: campaign.vendorProfileId,
          });
          continue;
        }

        // Charge the daily spend
        await this.adCreditService.spendCredits(
          campaign.vendorProfileId,
          dailySpend,
          campaign.id,
        );

        // Update campaign spend metrics
        await this.campaignRepository.incrementMetrics(campaign.id, {
          creditsSpent: dailySpend,
        });

        // Update daily stat
        await this.campaignRepository.incrementDailyMetrics(
          campaign.id,
          new Date(),
          { creditsSpent: dailySpend },
        );

        charged++;
      } catch (error) {
        this.logger.error(
          `Failed to process daily spend for campaign ${campaign.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `Daily spend processing complete. Processed: ${processed}, Charged: ${charged}, Paused: ${paused}, Completed: ${completed}`,
    );

    return { processed, charged, paused, completed };
  }

  /**
   * Expire campaigns past end date
   */
  async expireEndedCampaigns(): Promise<number> {
    this.logger.log('Checking for expired campaigns...');

    const expiredCampaigns = await this.campaignRepository.findExpired();

    for (const campaign of expiredCampaigns) {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.COMPLETED,
      });

      this.eventEmitter.emit('campaign.expired', {
        campaignId: campaign.id,
        vendorProfileId: campaign.vendorProfileId,
      });
    }

    this.logger.log(`Expired ${expiredCampaigns.length} campaigns`);
    return expiredCampaigns.length;
  }

  /**
   * Activate scheduled campaigns that have reached start date
   */
  async activateScheduledCampaigns(): Promise<number> {
    this.logger.log('Checking for scheduled campaigns to activate...');

    const scheduledCampaigns = await this.campaignRepository.findScheduled();
    let activated = 0;

    for (const campaign of scheduledCampaigns) {
      try {
        // Verify vendor still has credits
        const canAfford = await this.adCreditService.canAfford(
          campaign.vendorProfileId,
          campaign.dailyBudget,
        );

        if (canAfford) {
          await this.campaignRepository.update(campaign.id, {
            status: CampaignStatus.ACTIVE,
          });
          activated++;

          this.eventEmitter.emit('campaign.activated', {
            campaignId: campaign.id,
            vendorProfileId: campaign.vendorProfileId,
          });
        } else {
          // Not enough credits, keep as scheduled but notify
          this.eventEmitter.emit('campaign.activation-failed', {
            campaignId: campaign.id,
            vendorProfileId: campaign.vendorProfileId,
            reason: 'insufficient_credits',
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to activate scheduled campaign ${campaign.id}`,
          error,
        );
      }
    }

    this.logger.log(`Activated ${activated} scheduled campaigns`);
    return activated;
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get campaign stats
   */
  async getStats(campaignId: string): Promise<CampaignStatsDto> {
    const campaign = await this.findById(campaignId);

    const ctr = campaign.impressions > 0
      ? (campaign.clicks / campaign.impressions) * 100
      : 0;

    const conversionRate = campaign.clicks > 0
      ? (campaign.conversions / campaign.clicks) * 100
      : 0;

    const costPerClick = campaign.clicks > 0
      ? campaign.creditsSpent / campaign.clicks
      : 0;

    const costPerConversion = campaign.conversions > 0
      ? campaign.creditsSpent / campaign.conversions
      : 0;

    const budgetUtilization = campaign.totalBudget > 0
      ? (campaign.creditsSpent / campaign.totalBudget) * 100
      : 0;

    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await this.campaignRepository.getDailyStats(
      campaignId,
      thirtyDaysAgo,
      new Date(),
    );

    return {
      campaignId: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      creditsSpent: campaign.creditsSpent,
      totalBudget: campaign.totalBudget,
      dailyBudget: campaign.dailyBudget,
      remainingBudget: campaign.totalBudget - campaign.creditsSpent,
      ctr: Math.round(ctr * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      costPerClick: Math.round(costPerClick * 100) / 100,
      costPerConversion: Math.round(costPerConversion * 100) / 100,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      dailyStats: dailyStats.map((stat) => ({
        date: stat.date,
        impressions: stat.impressions,
        clicks: stat.clicks,
        conversions: stat.conversions,
        creditsSpent: stat.creditsSpent,
      })),
    };
  }

  /**
   * Get vendor's campaigns
   */
  async getVendorCampaigns(
    vendorProfileId: string,
    status?: CampaignStatus,
  ): Promise<Campaign[]> {
    return this.campaignRepository.findByVendorProfile(
      vendorProfileId,
      status,
      {
        dailyStats: {
          take: 7,
          orderBy: { date: 'desc' },
        },
      },
    );
  }

  /**
   * Get all campaigns (Admin method)
   * Supports filtering, pagination, and sorting
   */
  async getAllCampaigns(options: {
    status?: CampaignStatus;
    vendorProfileId?: string;
    type?: CampaignType;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ campaigns: Campaign[]; total: number; totalPages: number }> {
    const {
      status,
      vendorProfileId,
      type,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(vendorProfileId && { vendorProfileId }),
      ...(type && { type }),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const { campaigns, total } = await this.campaignRepository.findAll(
      where,
      {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      { createdAt: 'desc' },
      skip,
      limit,
    );

    return {
      campaigns,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get pending approval campaigns (Admin method)
   */
  async getPendingApprovalCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.findPendingApproval({
      vendorProfile: {
        select: {
          id: true,
          businessName: true,
          slug: true,
        },
      },
    });
  }

  /**
   * Get campaign counts by status (Admin method)
   */
  async getCampaignCountsByStatus(): Promise<Record<string, number>> {
    const statuses = Object.values(CampaignStatus);
    const counts: Record<string, number> = {};

    for (const status of statuses) {
      counts[status] = await this.campaignRepository.countByStatus(status);
    }

    counts.TOTAL = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return counts;
  }

  /**
   * Get active campaigns by type for a vendor
   */
  async getActiveCampaignsByType(
    vendorProfileId: string,
    type: CampaignType,
  ): Promise<Campaign[]> {
    const campaigns = await this.campaignRepository.findActiveByVendorProfile(
      vendorProfileId,
    );
    return campaigns.filter((c) => c.type === type);
  }
}
