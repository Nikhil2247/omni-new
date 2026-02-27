// ============================================================================
// INSIGHTS CONTROLLER - Admin Analytics Dashboard API
// ============================================================================
// Provides endpoints for admin dashboard analytics and insights
// ============================================================================

import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  InsightsAggregatorService,
  PlatformMetricsService,
  UserEngagementService,
  VendorMetricsService,
} from 'src/domain';
import { AutomatedCountsService } from '../../../domain/insights/services/automated-counts.service';
import { ComprehensiveMetricsService } from '../../../domain/insights/services/comprehensive-metrics.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import {
  AdminOnly,
} from '../../../core/auth/decorators/roles.decorator';

// ============================================================================
// DTOs
// ============================================================================

class DateRangeDto {
  startDate?: string;
  endDate?: string;
  days?: number;
}

class PaginationDto {
  limit?: number;
  offset?: number;
}

// ============================================================================
// CONTROLLER
// ============================================================================

@Controller('insights')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class InsightsController {
  constructor(
    private readonly aggregator: InsightsAggregatorService,
    private readonly userEngagement: UserEngagementService,
    private readonly vendorMetrics: VendorMetricsService,
    private readonly platformMetrics: PlatformMetricsService,
    private readonly automatedCounts: AutomatedCountsService,
    private readonly comprehensiveMetrics: ComprehensiveMetricsService,
  ) {}

  // ============================================================================
  // DASHBOARD ENDPOINTS
  // ============================================================================

  /**
   * Get complete admin dashboard data
   */
  @Get('dashboard')
  async getDashboard() {
    return this.aggregator.getAdminDashboard();
  }

  /**
   * Get executive summary
   */
  @Get('executive-summary')
  async getExecutiveSummary(
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.aggregator.getExecutiveSummary(period || 'month');
  }

  /**
   * Get real-time statistics
   */
  @Get('real-time')
  async getRealTimeStats() {
    return this.aggregator.getRealTimeStats();
  }

  // ============================================================================
  // AUTOMATED COUNTS ENDPOINTS
  // ============================================================================

  /**
   * Get all platform counts (cached, fast)
   * Perfect for displaying quick stats on frontend
   */
  @Get('counts')
  async getAllCounts() {
    return this.automatedCounts.getCounts();
  }

  /**
   * Force refresh all counts (admin only)
   */
  @Get('counts/refresh')
  async refreshCounts() {
    const counts = await this.automatedCounts.refreshCounts();
    return {
      success: true,
      message: 'Counts refreshed successfully',
      counts,
    };
  }

  /**
   * Get count for a specific entity
   */
  @Get('counts/:entity')
  async getEntityCount(
    @Param('entity')
    entity:
      | 'users'
      | 'vendors'
      | 'leads'
      | 'events'
      | 'categories'
      | 'services'
      | 'portfolios'
      | 'reviews',
  ) {
    const count = await this.automatedCounts.getEntityCount(entity);
    return { entity, count };
  }

  // ============================================================================
  // PLATFORM METRICS ENDPOINTS
  // ============================================================================

  /**
   * Get platform overview
   */
  @Get('platform/overview')
  async getPlatformOverview() {
    return this.platformMetrics.getPlatformOverview();
  }

  /**
   * Get growth metrics
   */
  @Get('platform/growth')
  async getGrowthMetrics(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.platformMetrics.getGrowthMetrics(period || 'month');
  }

  /**
   * Get daily platform metrics
   */
  @Get('platform/daily')
  async getDailyMetrics(@Query() query: DateRangeDto) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

    return this.platformMetrics.getDailyMetrics(startDate, endDate);
  }

  /**
   * Get user type distribution
   */
  @Get('platform/distributions/users')
  async getUserDistribution() {
    return this.platformMetrics.getUserTypeDistribution();
  }

  /**
   * Get vendor verification distribution
   */
  @Get('platform/distributions/vendors')
  async getVendorDistribution() {
    return this.platformMetrics.getVendorVerificationDistribution();
  }

  /**
   * Get lead status distribution
   */
  @Get('platform/distributions/leads')
  async getLeadDistribution() {
    return this.platformMetrics.getLeadStatusDistribution();
  }

  /**
   * Get event status distribution
   */
  @Get('platform/distributions/events')
  async getEventDistribution() {
    return this.platformMetrics.getEventStatusDistribution();
  }

  /**
   * Get search analytics
   */
  @Get('platform/search')
  async getSearchAnalytics(@Query('days') days?: number) {
    return this.platformMetrics.getSearchAnalytics(days || 30);
  }

  // ============================================================================
  // USER ENGAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Get engagement trends
   */
  @Get('engagement/trends')
  async getEngagementTrends(@Query() query: DateRangeDto) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

    return this.userEngagement.getEngagementTrends(startDate, endDate);
  }

  /**
   * Get DAU/WAU/MAU metrics
   */
  @Get('engagement/active-users')
  async getActiveUsers() {
    const [dau, wau, mau] = await Promise.all([
      this.userEngagement.getDailyActiveUsers(),
      this.userEngagement.getWeeklyActiveUsers(),
      this.userEngagement.getMonthlyActiveUsers(),
    ]);

    return {
      dau,
      wau,
      mau,
      dauWauRatio: wau > 0 ? Math.round((dau / wau) * 100) / 100 : 0,
      dauMauRatio: mau > 0 ? Math.round((dau / mau) * 100) / 100 : 0,
      wauMauRatio: mau > 0 ? Math.round((wau / mau) * 100) / 100 : 0,
    };
  }

  /**
   * Get top engaged users
   */
  @Get('engagement/top-users')
  async getTopEngagedUsers(
    @Query('limit') limit?: number,
    @Query('days') days?: number,
  ) {
    return this.userEngagement.getTopEngagedUsers(limit || 10, days || 30);
  }

  /**
   * Get retention cohorts
   */
  @Get('engagement/retention')
  async getRetentionCohorts(@Query('weeks') weeks?: number) {
    return this.userEngagement.getRetentionCohorts(weeks || 8);
  }

  /**
   * Get specific user's engagement
   */
  @Get('engagement/user/:userId')
  async getUserEngagement(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: DateRangeDto,
  ) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

    const [metrics, summary] = await Promise.all([
      this.userEngagement.getUserEngagement(userId, startDate, endDate),
      this.userEngagement.getUserSummary(userId),
    ]);

    return { metrics, summary };
  }

  // ============================================================================
  // VENDOR METRICS ENDPOINTS
  // ============================================================================

  /**
   * Get top performing vendors
   */
  @Get('vendors/top')
  async getTopVendors(
    @Query('limit') limit?: number,
    @Query('days') days?: number,
  ) {
    return this.vendorMetrics.getTopVendors(limit || 10, days || 30);
  }

  /**
   * Get vendor rankings
   */
  @Get('vendors/rankings')
  async getVendorRankings(
    @Query('limit') limit?: number,
    @Query('days') days?: number,
  ) {
    return this.vendorMetrics.getVendorRankings(days || 30, limit || 100);
  }

  /**
   * Get industry benchmarks
   */
  @Get('vendors/benchmarks')
  async getIndustryBenchmarks(@Query('days') days?: number) {
    return this.vendorMetrics.getIndustryBenchmarks(days || 30);
  }

  /**
   * Get specific vendor's metrics
   */
  @Get('vendors/:vendorId')
  async getVendorMetrics(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query() query: DateRangeDto,
  ) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

    const [metrics, summary, insights] = await Promise.all([
      this.vendorMetrics.getVendorMetrics(vendorId, startDate, endDate),
      this.vendorMetrics.getVendorSummary(vendorId, query.days || 30),
      this.aggregator.getVendorInsights(vendorId),
    ]);

    return { metrics, summary, insights };
  }

  /**
   * Compare vendors
   */
  @Get('vendors/compare')
  async compareVendors(
    @Query('ids') ids: string,
    @Query('days') days?: number,
  ) {
    const vendorIds = ids.split(',').map((id) => id.trim());
    const comparisons = await this.vendorMetrics.compareVendors(
      vendorIds,
      days || 30,
    );

    return Object.fromEntries(comparisons);
  }

  // ============================================================================
  // EXPORT ENDPOINTS
  // ============================================================================

  /**
   * Export metrics data
   */
  @Get('export')
  async exportMetrics(
    @Query() query: DateRangeDto,
    @Query('format') format?: 'json' | 'csv',
  ) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

    return this.aggregator.exportMetrics(startDate, endDate, format || 'json');
  }

  // ============================================================================
  // AGGREGATION ENDPOINTS (for manual trigger)
  // ============================================================================

  /**
   * Trigger daily metrics aggregation
   */
  @Get('aggregate/daily')
  async triggerDailyAggregation(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    await this.platformMetrics.aggregateDailyMetrics(targetDate);

    return {
      success: true,
      message: `Aggregation completed for ${targetDate.toISOString()}`,
    };
  }

  /**
   * Backfill metrics for historical data
   * This will create metrics entries for the specified number of days
   */
  @Get('backfill')
  async backfillMetrics(@Query('days') days?: number) {
    const daysToBackfill = days || 30;
    const results: Array<{ date: string; success: boolean; error?: string }> =
      [];

    for (let i = daysToBackfill; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      try {
        await this.platformMetrics.aggregateDailyMetrics(targetDate);
        results.push({
          date: targetDate.toISOString(),
          success: true,
        });
      } catch (error) {
        results.push({
          date: targetDate.toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      message: `Backfill completed: ${successCount} succeeded, ${failCount} failed`,
      daysProcessed: results.length,
      results,
    };
  }
}
