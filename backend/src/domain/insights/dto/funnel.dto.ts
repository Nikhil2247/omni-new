import { IsString, IsInt, IsOptional, IsObject, IsDateString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for tracking a funnel event
 */
export class TrackFunnelEventDto {
  @IsString()
  funnelName: string;

  @IsInt()
  @Min(0)
  stepIndex: number;

  @IsString()
  stepName: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  anonymousId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}

/**
 * DTO for analyzing a funnel
 */
export class AnalyzeFunnelDto {
  @IsString()
  funnelName: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

/**
 * DTO for getting funnel trends
 */
export class GetFunnelTrendsDto {
  @IsString()
  funnelName: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  interval?: 'day' | 'week' | 'month';
}

/**
 * DTO for getting top drop-off points
 */
export class GetTopDropOffPointsDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}

/**
 * DTO for getting user journey
 */
export class GetUserJourneyDto {
  @IsString()
  sessionId: string;
}
