// ============================================================================
// USER ANALYTICS CONTROLLER - Client-side Engagement Tracking
// ============================================================================
// Accepts richer client analytics payloads (scroll depth, duration, device)
// ============================================================================

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { UserId } from '../../../core/auth/decorators/current-user.decorator';
import { AnalyticsTrackingService } from '../../../domain/insights/services/analytics-tracking.service';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

class ProfileViewAnalyticsDto {
  @IsUUID()
  vendorProfileId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  scrollDepth?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

@Controller('user/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class AnalyticsController {
  constructor(private readonly analyticsTracking: AnalyticsTrackingService) {}

  @Post('profile-view')
  async trackProfileView(
    @Body() dto: ProfileViewAnalyticsDto,
    @UserId() userId: string,
  ) {
    await this.analyticsTracking.trackProfileView({
      vendorProfileId: dto.vendorProfileId,
      viewerId: userId,
      sessionId: dto.sessionId,
      source: dto.source,
      referrer: dto.referrer,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      deviceType: dto.deviceType,
      browser: dto.browser,
      os: dto.os,
      duration: dto.duration,
      scrollDepth: dto.scrollDepth,
      country: dto.country,
      city: dto.city,
    });

    return { success: true };
  }
}
