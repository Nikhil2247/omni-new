// ============================================================================
// ANALYTICS TRACKING SERVICE - Profile Views & Search Queries
// ============================================================================
// Persists raw analytics events for reporting and aggregation
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

export interface ProfileViewPayload {
  vendorProfileId: string;
  viewerId?: string;
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
}

export interface SearchQueryPayload {
  query: string;
  userId?: string;
  sessionId?: string;
  categoryId?: string;
  cityId?: string;
  filters?: Record<string, unknown>;
  resultCount: number;
  hasResults: boolean;
  clickedResults?: string[];
  deviceType?: string;
  country?: string;
  city?: string;
}

@Injectable()
export class AnalyticsTrackingService {
  private readonly logger = new Logger(AnalyticsTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async trackProfileView(payload: ProfileViewPayload): Promise<void> {
    try {
      await this.prisma.profileView.create({
        data: {
          vendorProfileId: payload.vendorProfileId,
          viewerId: payload.viewerId ?? undefined,
          sessionId: payload.sessionId ?? undefined,
          source: payload.source ?? undefined,
          referrer: payload.referrer ?? undefined,
          utmSource: payload.utmSource ?? undefined,
          utmMedium: payload.utmMedium ?? undefined,
          utmCampaign: payload.utmCampaign ?? undefined,
          deviceType: payload.deviceType ?? undefined,
          browser: payload.browser ?? undefined,
          os: payload.os ?? undefined,
          duration: payload.duration ?? undefined,
          scrollDepth: payload.scrollDepth ?? undefined,
          country: payload.country ?? undefined,
          city: payload.city ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track profile view', error);
    }
  }

  async trackSearchQuery(payload: SearchQueryPayload): Promise<void> {
    const query = payload.query?.trim() || 'all';
    const queryNormalized = query.toLowerCase();

    try {
      await this.prisma.searchQuery.create({
        data: {
          userId: payload.userId ?? undefined,
          sessionId: payload.sessionId ?? undefined,
          query,
          queryNormalized,
          categoryId: payload.categoryId ?? undefined,
          cityId: payload.cityId ?? undefined,
          filters: payload.filters
            ? (payload.filters as Prisma.InputJsonValue)
            : undefined,
          resultCount: payload.resultCount,
          hasResults: payload.hasResults,
          clickedResults: payload.clickedResults ?? [],
          deviceType: payload.deviceType ?? undefined,
          country: payload.country ?? undefined,
          city: payload.city ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track search query', error);
    }
  }
}
