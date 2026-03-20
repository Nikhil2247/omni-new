// ============================================================================
// CAMPAIGN REPOSITORY - Subscription Domain
// ============================================================================
// Handles database operations for advertising campaigns
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  Prisma,
  Campaign,
  CampaignDailyStats,
  CampaignStatus,
} from '@prisma/client';

@Injectable()
export class CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // Campaign CRUD Operations
  // ============================================================================

  async create(data: Prisma.CampaignCreateInput): Promise<Campaign> {
    return this.prisma.campaign.create({ data });
  }

  async findById(
    id: string,
    include?: Prisma.CampaignInclude,
  ): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id },
      include,
    });
  }

  async findByVendorProfile(
    vendorProfileId: string,
    status?: CampaignStatus,
    include?: Prisma.CampaignInclude,
  ): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: {
        vendorProfileId,
        ...(status && { status }),
      },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(include?: Prisma.CampaignInclude): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
      },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingApproval(include?: Prisma.CampaignInclude): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.PENDING_APPROVAL,
      },
      include,
      orderBy: { submittedAt: 'asc' },
    });
  }

  async findAll(
    where?: Prisma.CampaignWhereInput,
    include?: Prisma.CampaignInclude,
    orderBy?: Prisma.CampaignOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<{ campaigns: Campaign[]; total: number }> {
    const [campaigns, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        include,
        orderBy: orderBy || { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return { campaigns, total };
  }

  async countByStatus(status?: CampaignStatus): Promise<number> {
    return this.prisma.campaign.count({
      where: status ? { status } : undefined,
    });
  }

  async findActiveByVendorProfile(
    vendorProfileId: string,
    include?: Prisma.CampaignInclude,
  ): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: {
        vendorProfileId,
        status: CampaignStatus.ACTIVE,
      },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findScheduled(): Promise<Campaign[]> {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.SCHEDULED,
        startDate: { lte: now },
      },
      include: {
        vendorProfile: true,
      },
    });
  }

  async findExpired(): Promise<Campaign[]> {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        endDate: { lte: now },
      },
    });
  }

  async findCampaignsExhausted(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        // Credits spent >= total budget
        creditsSpent: {
          gte: this.prisma.campaign.fields.totalBudget,
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.CampaignUpdateInput,
  ): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id },
      data,
      include: {
        vendorProfile: true,
        dailyStats: {
          take: 7,
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async delete(id: string): Promise<Campaign> {
    return this.prisma.campaign.delete({
      where: { id },
    });
  }

  async incrementMetrics(
    id: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      creditsSpent?: number;
    },
  ): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(metrics.impressions && {
          impressions: { increment: metrics.impressions },
        }),
        ...(metrics.clicks && { clicks: { increment: metrics.clicks } }),
        ...(metrics.conversions && {
          conversions: { increment: metrics.conversions },
        }),
        ...(metrics.creditsSpent && {
          creditsSpent: { increment: metrics.creditsSpent },
        }),
      },
    });
  }

  // ============================================================================
  // Daily Stats Operations
  // ============================================================================

  async getDailyStats(
    campaignId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CampaignDailyStats[]> {
    return this.prisma.campaignDailyStats.findMany({
      where: {
        campaignId,
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      orderBy: { date: 'desc' },
    });
  }

  async getDailyStat(
    campaignId: string,
    date: Date,
  ): Promise<CampaignDailyStats | null> {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return this.prisma.campaignDailyStats.findUnique({
      where: {
        campaignId_date: {
          campaignId,
          date: normalizedDate,
        },
      },
    });
  }

  async createDailyStat(
    data: Prisma.CampaignDailyStatsCreateInput,
  ): Promise<CampaignDailyStats> {
    return this.prisma.campaignDailyStats.create({ data });
  }

  async updateDailyStat(
    campaignId: string,
    date: Date,
    data: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      creditsSpent?: number;
    },
  ): Promise<CampaignDailyStats> {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return this.prisma.campaignDailyStats.upsert({
      where: {
        campaignId_date: {
          campaignId,
          date: normalizedDate,
        },
      },
      update: {
        ...(data.impressions !== undefined && {
          impressions: { increment: data.impressions },
        }),
        ...(data.clicks !== undefined && {
          clicks: { increment: data.clicks },
        }),
        ...(data.conversions !== undefined && {
          conversions: { increment: data.conversions },
        }),
        ...(data.creditsSpent !== undefined && {
          creditsSpent: { increment: data.creditsSpent },
        }),
      },
      create: {
        campaign: { connect: { id: campaignId } },
        date: normalizedDate,
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        conversions: data.conversions || 0,
        creditsSpent: data.creditsSpent || 0,
      },
    });
  }

  async incrementDailyMetrics(
    campaignId: string,
    date: Date,
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      creditsSpent?: number;
    },
  ): Promise<CampaignDailyStats> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return this.prisma.campaignDailyStats.upsert({
      where: {
        campaignId_date: {
          campaignId,
          date: normalizedDate,
        },
      },
      update: {
        ...(metrics.impressions && {
          impressions: { increment: metrics.impressions },
        }),
        ...(metrics.clicks && { clicks: { increment: metrics.clicks } }),
        ...(metrics.conversions && {
          conversions: { increment: metrics.conversions },
        }),
        ...(metrics.creditsSpent && {
          creditsSpent: { increment: metrics.creditsSpent },
        }),
      },
      create: {
        campaign: { connect: { id: campaignId } },
        date: normalizedDate,
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        conversions: metrics.conversions || 0,
        creditsSpent: metrics.creditsSpent || 0,
      },
    });
  }

  // ============================================================================
  // Aggregation Queries
  // ============================================================================

  async getAggregatedStats(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalCreditsSpent: number;
  }> {
    const result = await this.prisma.campaignDailyStats.aggregate({
      where: {
        campaignId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        creditsSpent: true,
      },
    });

    return {
      totalImpressions: result._sum.impressions || 0,
      totalClicks: result._sum.clicks || 0,
      totalConversions: result._sum.conversions || 0,
      totalCreditsSpent: result._sum.creditsSpent || 0,
    };
  }

  async countByVendorAndStatus(
    vendorProfileId: string,
    status: CampaignStatus,
  ): Promise<number> {
    return this.prisma.campaign.count({
      where: {
        vendorProfileId,
        status,
      },
    });
  }
}
