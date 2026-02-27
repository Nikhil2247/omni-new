// ============================================================================
// INSIGHTS MODULE - Analytics and Metrics
// ============================================================================
// Provides platform-wide analytics, user engagement tracking,
// vendor performance metrics, and admin dashboard insights
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { UserEngagementService } from './services/user-engagement.service';
import { AnalyticsTrackingService } from './services/analytics-tracking.service';
import { VendorMetricsService } from './services/vendor-metrics.service';
import { PlatformMetricsService } from './services/platform-metrics.service';
import { InsightsAggregatorService } from './services/insights-aggregator.service';
import { AutomatedCountsService } from './services/automated-counts.service';
import { ComprehensiveMetricsService } from './services/comprehensive-metrics.service';
import { EngagementListener } from './listeners/engagement.listener';

@Module({
  imports: [DatabaseModule],
  providers: [
    UserEngagementService,
    VendorMetricsService,
    PlatformMetricsService,
    InsightsAggregatorService,
    AnalyticsTrackingService,
    AutomatedCountsService,
    ComprehensiveMetricsService,
    EngagementListener,
  ],
  exports: [
    UserEngagementService,
    VendorMetricsService,
    PlatformMetricsService,
    InsightsAggregatorService,
    AnalyticsTrackingService,
    AutomatedCountsService,
    ComprehensiveMetricsService,
  ],
})
export class InsightsModule {}
