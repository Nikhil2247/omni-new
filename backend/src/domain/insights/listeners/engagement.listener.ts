// ============================================================================
// ENGAGEMENT LISTENER - Event-driven Metrics Tracking
// ============================================================================
// Listens to domain events and tracks engagement/metrics automatically
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEngagementService } from '../services/user-engagement.service';
import { VendorMetricsService } from '../services/vendor-metrics.service';
import { AnalyticsTrackingService } from '../services/analytics-tracking.service';
import { ANALYTICS_EVENTS } from '../../../core/events/event-constants';

@Injectable()
export class EngagementListener {
  private readonly logger = new Logger(EngagementListener.name);

  constructor(
    private readonly userEngagement: UserEngagementService,
    private readonly vendorMetrics: VendorMetricsService,
    private readonly analyticsTracking: AnalyticsTrackingService,
  ) {}

  // ============================================================================
  // USER ENGAGEMENT EVENTS
  // ============================================================================

  @OnEvent('user.session.started')
  async handleSessionStarted(payload: { userId: string }): Promise<void> {
    this.logger.debug(`Session started for user ${payload.userId}`);
  }

  @OnEvent('user.session.ended')
  async handleSessionEnded(payload: {
    userId: string;
    durationSeconds: number;
  }): Promise<void> {
    await this.userEngagement.trackSession(
      payload.userId,
      payload.durationSeconds,
    );
    this.logger.debug(
      `Session ended for user ${payload.userId}: ${payload.durationSeconds}s`,
    );
  }

  @OnEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED)
  async handleSearchPerformed(payload: {
    query: string;
    resultCount: number;
    hasResults: boolean;
    userId?: string;
    sessionId?: string;
    categoryId?: string;
    cityId?: string;
    filters?: Record<string, unknown>;
    deviceType?: string;
    country?: string;
    city?: string;
  }): Promise<void> {
    if (payload.userId) {
      await this.userEngagement.trackSearch(payload.userId);
    }

    await this.analyticsTracking.trackSearchQuery({
      query: payload.query,
      userId: payload.userId,
      sessionId: payload.sessionId,
      categoryId: payload.categoryId,
      cityId: payload.cityId,
      filters: payload.filters,
      resultCount: payload.resultCount,
      hasResults: payload.hasResults,
      deviceType: payload.deviceType,
      country: payload.country,
      city: payload.city,
    });
  }

  @OnEvent(ANALYTICS_EVENTS.PROFILE_VIEWED)
  async handleProfileViewed(payload: {
    viewerId?: string;
    vendorProfileId: string;
    sessionId?: string;
    source?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    duration?: number;
    scrollDepth?: number;
    country?: string;
    city?: string;
  }): Promise<void> {
    // Track user engagement
    if (payload.viewerId) {
      await this.userEngagement.trackProfileView(payload.viewerId);
    }

    // Track vendor metrics
    await this.vendorMetrics.trackProfileView(payload.vendorProfileId);

    // Store raw profile view
    await this.analyticsTracking.trackProfileView({
      vendorProfileId: payload.vendorProfileId,
      viewerId: payload.viewerId,
      sessionId: payload.sessionId,
      source: payload.source,
      referrer: payload.referrer,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
      deviceType: payload.deviceType,
      browser: payload.browser,
      os: payload.os,
      duration: payload.duration,
      scrollDepth: payload.scrollDepth,
      country: payload.country,
      city: payload.city,
    });
  }

  @OnEvent('wishlist.item.added')
  async handleWishlistAdded(payload: {
    userId: string;
    vendorProfileId: string;
  }): Promise<void> {
    await this.userEngagement.trackWishlistAdd(payload.userId);
    await this.vendorMetrics.trackWishlistAdd(payload.vendorProfileId);
  }

  @OnEvent('checklist.updated')
  async handleChecklistUpdated(payload: { userId: string }): Promise<void> {
    await this.userEngagement.trackChecklistUpdate(payload.userId);
  }

  @OnEvent('budget.updated')
  async handleBudgetUpdated(payload: { userId: string }): Promise<void> {
    await this.userEngagement.trackBudgetUpdate(payload.userId);
  }

  // ============================================================================
  // LEAD EVENTS
  // ============================================================================

  @OnEvent('lead.created')
  async handleLeadCreated(payload: {
    userId: string;
    vendorProfileId: string;
  }): Promise<void> {
    await this.userEngagement.trackLeadSent(payload.userId);
    await this.vendorMetrics.trackLeadReceived(payload.vendorProfileId);
  }

  @OnEvent('lead.responded')
  async handleLeadResponded(payload: {
    vendorProfileId: string;
    responseTimeMinutes: number;
  }): Promise<void> {
    await this.vendorMetrics.trackLeadResponded(
      payload.vendorProfileId,
      payload.responseTimeMinutes,
    );
  }

  @OnEvent('lead.converted')
  async handleLeadConverted(payload: {
    vendorProfileId: string;
    revenue?: number;
  }): Promise<void> {
    await this.vendorMetrics.trackLeadConverted(
      payload.vendorProfileId,
      payload.revenue,
    );
  }

  // ============================================================================
  // MESSAGE EVENTS
  // ============================================================================

  @OnEvent('message.sent')
  async handleMessageSent(payload: { senderId: string }): Promise<void> {
    await this.userEngagement.trackMessageSent(payload.senderId);
  }

  // ============================================================================
  // VENDOR EVENTS
  // ============================================================================

  @OnEvent('vendor.search.appeared')
  async handleVendorSearchAppeared(payload: {
    vendorProfileId: string;
  }): Promise<void> {
    await this.vendorMetrics.trackSearchAppearance(payload.vendorProfileId);
  }

  @OnEvent('vendor.search.clicked')
  async handleVendorSearchClicked(payload: {
    vendorProfileId: string;
  }): Promise<void> {
    await this.vendorMetrics.trackSearchClick(payload.vendorProfileId);
  }

  @OnEvent('vendor.portfolio.viewed')
  async handlePortfolioViewed(payload: {
    vendorProfileId: string;
  }): Promise<void> {
    await this.vendorMetrics.trackPortfolioView(payload.vendorProfileId);
  }
}
