// ============================================================================
// LOGIN ACTIVITY SERVICE - Login Attempt Tracking & Security Analysis
// ============================================================================
// Records all authentication attempts for security auditing and risk analysis
// Provides insights for suspicious activity detection
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoginMethod } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface LoginAttemptDetails {
  email: string;
  userId?: string;
  success: boolean;
  failureReason?: string;
  loginMethod: LoginMethod;
  ipAddress: string;
  userAgent?: string;
  twoFactorUsed?: boolean;
  twoFactorMethod?: string;
}

export interface DeviceInfo {
  deviceType?: string;
  browser?: string;
  os?: string;
}

export interface GeoLocation {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface RiskAssessment {
  riskScore: number;
  riskFactors: string[];
  isSuspicious: boolean;
}

export interface LoginActivitySummary {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  uniqueIPs: number;
  uniqueDevices: number;
  suspiciousAttempts: number;
  recentActivities: {
    id: string;
    success: boolean;
    loginMethod: string;
    ipAddress: string;
    deviceType?: string;
    country?: string;
    createdAt: Date;
  }[];
}

@Injectable()
export class LoginActivityService {
  private readonly logger = new Logger(LoginActivityService.name);

  // Risk scoring thresholds
  private readonly RISK_THRESHOLD_SUSPICIOUS = 50;
  private readonly RISK_THRESHOLD_HIGH = 75;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Record a login attempt with full details
   */
  async recordLoginAttempt(
    details: LoginAttemptDetails,
    deviceInfo?: DeviceInfo,
    geoLocation?: GeoLocation,
  ): Promise<string> {
    // Calculate risk assessment
    const riskAssessment = await this.assessRisk(
      details.email,
      details.ipAddress,
      deviceInfo,
      geoLocation,
    );

    const activity = await this.prisma.loginActivity.create({
      data: {
        userId: details.userId,
        email: details.email,
        success: details.success,
        failureReason: details.failureReason,
        loginMethod: details.loginMethod,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        deviceType: deviceInfo?.deviceType,
        browser: deviceInfo?.browser,
        os: deviceInfo?.os,
        country: geoLocation?.country,
        city: geoLocation?.city,
        latitude: geoLocation?.latitude,
        longitude: geoLocation?.longitude,
        riskScore: riskAssessment.riskScore,
        riskFactors: riskAssessment.riskFactors,
        isSuspicious: riskAssessment.isSuspicious,
        twoFactorUsed: details.twoFactorUsed ?? false,
        twoFactorMethod: details.twoFactorMethod,
      },
    });

    // Emit events for suspicious activity
    if (riskAssessment.isSuspicious) {
      this.eventEmitter.emit('security.suspiciousLogin', {
        activityId: activity.id,
        userId: details.userId,
        email: details.email,
        ipAddress: details.ipAddress,
        riskScore: riskAssessment.riskScore,
        riskFactors: riskAssessment.riskFactors,
        timestamp: new Date(),
      });

      this.logger.warn(
        `Suspicious login detected for ${details.email} from ${details.ipAddress}. Risk: ${riskAssessment.riskScore}`,
      );
    }

    // Emit event for failed login (for monitoring)
    if (!details.success) {
      this.eventEmitter.emit('security.failedLogin', {
        activityId: activity.id,
        email: details.email,
        ipAddress: details.ipAddress,
        failureReason: details.failureReason,
        timestamp: new Date(),
      });
    }

    return activity.id;
  }

  /**
   * Assess risk level of a login attempt
   */
  async assessRisk(
    email: string,
    ipAddress: string,
    deviceInfo?: DeviceInfo,
    geoLocation?: GeoLocation,
  ): Promise<RiskAssessment> {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Get user's login history
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (user) {
      const recentActivity = await this.prisma.loginActivity.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      // Check for new device
      const knownDevices = new Set(
        recentActivity.map((a) => `${a.deviceType}-${a.browser}-${a.os}`),
      );
      const currentDevice = `${deviceInfo?.deviceType}-${deviceInfo?.browser}-${deviceInfo?.os}`;
      if (knownDevices.size > 0 && !knownDevices.has(currentDevice)) {
        riskFactors.push('new_device');
        riskScore += 15;
      }

      // Check for new IP
      const knownIPs = new Set(recentActivity.map((a) => a.ipAddress));
      if (knownIPs.size > 0 && !knownIPs.has(ipAddress)) {
        riskFactors.push('new_ip');
        riskScore += 10;
      }

      // Check for new location
      if (geoLocation?.country) {
        const knownCountries = new Set(
          recentActivity.filter((a) => a.country).map((a) => a.country),
        );
        if (
          knownCountries.size > 0 &&
          !knownCountries.has(geoLocation.country)
        ) {
          riskFactors.push('new_country');
          riskScore += 25;
        }
      }

      // Check for rapid login attempts (potential brute force)
      const recentAttempts = await this.prisma.loginActivity.count({
        where: {
          email: email.toLowerCase(),
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        },
      });
      if (recentAttempts > 5) {
        riskFactors.push('rapid_attempts');
        riskScore += 30;
      }

      // Check for failed attempts from same IP
      const failedFromIP = await this.prisma.loginActivity.count({
        where: {
          ipAddress,
          success: false,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        },
      });
      if (failedFromIP > 10) {
        riskFactors.push('high_failure_rate_ip');
        riskScore += 35;
      }

      // Check for impossible travel (login from distant location in short time)
      if (geoLocation?.latitude && geoLocation?.longitude) {
        const lastSuccessfulLogin = recentActivity.find(
          (a) => a.success && a.latitude && a.longitude,
        );
        if (lastSuccessfulLogin) {
          const timeDiff = Date.now() - lastSuccessfulLogin.createdAt.getTime();
          const distance = this.calculateDistance(
            Number(lastSuccessfulLogin.latitude),
            Number(lastSuccessfulLogin.longitude),
            geoLocation.latitude,
            geoLocation.longitude,
          );
          // If traveled more than 500km in less than 1 hour
          if (distance > 500 && timeDiff < 60 * 60 * 1000) {
            riskFactors.push('impossible_travel');
            riskScore += 40;
          }
        }
      }
    } else {
      // Unknown user
      riskFactors.push('unknown_user');
      riskScore += 5;
    }

    // Check if IP is in known VPN/proxy range (simplified check)
    if (this.isLikelyVPN(ipAddress)) {
      riskFactors.push('vpn_detected');
      riskScore += 10;
    }

    // Check time-based anomalies (login at unusual hour)
    const hour = new Date().getUTCHours();
    if (hour >= 1 && hour <= 5) {
      riskFactors.push('unusual_hour');
      riskScore += 5;
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    return {
      riskScore,
      riskFactors,
      isSuspicious: riskScore >= this.RISK_THRESHOLD_SUSPICIOUS,
    };
  }

  /**
   * Get login activity summary for a user
   */
  async getUserActivitySummary(
    userId: string,
    days: number = 30,
  ): Promise<LoginActivitySummary> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await this.prisma.loginActivity.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueIPs = new Set(activities.map((a) => a.ipAddress));
    const uniqueDevices = new Set(
      activities.map((a) => `${a.deviceType}-${a.browser}-${a.os}`),
    );

    return {
      totalAttempts: activities.length,
      successfulAttempts: activities.filter((a) => a.success).length,
      failedAttempts: activities.filter((a) => !a.success).length,
      uniqueIPs: uniqueIPs.size,
      uniqueDevices: uniqueDevices.size,
      suspiciousAttempts: activities.filter((a) => a.isSuspicious).length,
      recentActivities: activities.slice(0, 10).map((a) => ({
        id: a.id,
        success: a.success,
        loginMethod: a.loginMethod as string,
        ipAddress: a.ipAddress,
        deviceType: a.deviceType || undefined,
        country: a.country || undefined,
        createdAt: a.createdAt,
      })),
    };
  }

  /**
   * Get recent suspicious activities across the platform
   */
  async getRecentSuspiciousActivities(limit: number = 50): Promise<
    {
      id: string;
      email: string;
      ipAddress: string;
      riskScore: number;
      riskFactors: string[];
      createdAt: Date;
    }[]
  > {
    const activities = await this.prisma.loginActivity.findMany({
      where: {
        isSuspicious: true,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        ipAddress: true,
        riskScore: true,
        riskFactors: true,
        createdAt: true,
      },
    });

    return activities;
  }

  /**
   * Get failed login attempts for an email (for monitoring)
   */
  async getFailedAttemptsCount(
    email: string,
    minutes: number = 15,
  ): Promise<number> {
    return this.prisma.loginActivity.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: new Date(Date.now() - minutes * 60 * 1000) },
      },
    });
  }

  /**
   * Check if IP has too many failed attempts (for rate limiting)
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    const failedCount = await this.prisma.loginActivity.count({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
    });

    return failedCount >= 20; // Block after 20 failed attempts per hour
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Simple VPN/proxy detection (in production, use a proper IP intelligence service)
   */
  private isLikelyVPN(ipAddress: string): boolean {
    // This is a simplified check - in production, integrate with services like:
    // - MaxMind GeoIP2
    // - IPinfo.io
    // - IP2Location

    // Check for common VPN/datacenter IP ranges (simplified)
    const vpnRanges = [
      '10.', // Private range often used by VPNs
      '172.16.', // Private range
      '192.168.', // Private range
    ];

    return vpnRanges.some((range) => ipAddress.startsWith(range));
  }

  /**
   * Parse user agent string to extract device info
   */
  parseUserAgent(userAgent: string): DeviceInfo {
    if (!userAgent) {
      return {};
    }

    const deviceInfo: DeviceInfo = {};

    // Detect device type
    if (/mobile/i.test(userAgent)) {
      deviceInfo.deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceInfo.deviceType = 'tablet';
    } else {
      deviceInfo.deviceType = 'desktop';
    }

    // Detect browser
    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
      deviceInfo.browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      deviceInfo.browser = 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      deviceInfo.browser = 'Safari';
    } else if (/edg/i.test(userAgent)) {
      deviceInfo.browser = 'Edge';
    } else if (/msie|trident/i.test(userAgent)) {
      deviceInfo.browser = 'IE';
    }

    // Detect OS
    if (/windows/i.test(userAgent)) {
      deviceInfo.os = 'Windows';
    } else if (/macintosh|mac os/i.test(userAgent)) {
      deviceInfo.os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      deviceInfo.os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      deviceInfo.os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      deviceInfo.os = 'iOS';
    }

    return deviceInfo;
  }
}
