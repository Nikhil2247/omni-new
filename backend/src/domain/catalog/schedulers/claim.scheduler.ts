// ============================================================================
// CLAIM SCHEDULER - Catalog Domain
// ============================================================================
// Scheduled tasks for vendor claim management and expiration handling
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VendorClaimService, VENDOR_CLAIM_EVENTS } from '../services/vendor-claim.service';
import { VendorClaimRepository } from '../repositories/vendor-claim.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { ClaimStatus } from '@prisma/client';
import { subDays } from 'date-fns';

// Configuration constants
const CLAIM_EXPIRY_DAYS = 30; // Claims expire after 30 days without approval
const CLAIM_WARNING_DAYS = 25; // Send warning 5 days before expiry

@Injectable()
export class ClaimScheduler {
  private readonly logger = new Logger(ClaimScheduler.name);

  constructor(
    private readonly vendorClaimService: VendorClaimService,
    private readonly vendorClaimRepository: VendorClaimRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // CLAIM EXPIRY JOB
  // ============================================================================

  /**
   * Expire claims that are older than 30 days without approval
   * Runs daily at 2:00 AM
   *
   * This job processes claims in the following statuses:
   * - PENDING: User initiated claim but never sent verification
   * - VERIFICATION_SENT: Verification sent but never completed
   * - VERIFIED: User verified but never approved by admin
   *
   * Claims are marked as EXPIRED and users are notified.
   */
  @Cron('0 2 * * *') // Run daily at 2:00 AM
  async expireOldClaims(): Promise<void> {
    this.logger.log('Starting claim expiry job...');

    try {
      const expiryThreshold = subDays(new Date(), CLAIM_EXPIRY_DAYS);

      // Find and expire old claims that haven't been approved/rejected
      const expiredClaims = await this.prisma.vendorClaim.findMany({
        where: {
          status: {
            in: [
              ClaimStatus.PENDING,
              ClaimStatus.VERIFICATION_SENT,
              ClaimStatus.VERIFIED,
            ],
          },
          createdAt: {
            lt: expiryThreshold,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
            },
          },
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      });

      if (expiredClaims.length === 0) {
        this.logger.log('No claims to expire');
        return;
      }

      this.logger.log(`Found ${expiredClaims.length} claims to expire`);

      let expiredCount = 0;
      let failedCount = 0;

      for (const claim of expiredClaims) {
        try {
          // Update claim status to EXPIRED
          await this.prisma.vendorClaim.update({
            where: { id: claim.id },
            data: {
              status: ClaimStatus.EXPIRED,
              reviewNotes: `Auto-expired after ${CLAIM_EXPIRY_DAYS} days without approval`,
            },
          });

          // Emit expiry event for notification handling
          this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.EXPIRED, {
            claimId: claim.id,
            userId: claim.userId,
            email: claim.user?.email,
            vendorProfileId: claim.vendorProfileId,
            businessName: claim.vendorProfile?.businessName,
            reason: 'Auto-expired due to inactivity',
          });

          // Send notification to user
          this.eventEmitter.emit('notification.send', {
            type: 'CLAIM_EXPIRED',
            recipient: claim.user?.email,
            data: {
              claimId: claim.id,
              businessName: claim.vendorProfile?.businessName,
              expiryDays: CLAIM_EXPIRY_DAYS,
              firstName: claim.user?.firstName || 'User',
            },
          });

          expiredCount++;
          this.logger.debug(`Expired claim ${claim.id} for vendor ${claim.vendorProfile?.businessName}`);
        } catch (error) {
          failedCount++;
          this.logger.error(
            `Failed to expire claim ${claim.id}: ${(error as Error).message}`,
          );
        }
      }

      this.logger.log(
        `Claim expiry job complete. Expired: ${expiredCount}, Failed: ${failedCount}`,
      );

      // Emit summary event for monitoring
      this.eventEmitter.emit('scheduler.claims-expired', {
        timestamp: new Date(),
        totalProcessed: expiredClaims.length,
        expiredCount,
        failedCount,
      });
    } catch (error) {
      this.logger.error('Claim expiry job failed', error);
      this.eventEmitter.emit('scheduler.claims-expired.failed', {
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // CLAIM EXPIRY WARNING
  // ============================================================================

  /**
   * Send warning notifications for claims approaching expiry (5 days before)
   * Runs daily at 9:00 AM
   */
  @Cron('0 9 * * *') // Run daily at 9:00 AM
  async sendExpiryWarnings(): Promise<void> {
    this.logger.log('Starting claim expiry warning job...');

    try {
      // Find claims that will expire in 5 days
      const warningThreshold = subDays(new Date(), CLAIM_WARNING_DAYS);
      const expiryThreshold = subDays(new Date(), CLAIM_WARNING_DAYS - 1);

      const warningClaims = await this.prisma.vendorClaim.findMany({
        where: {
          status: {
            in: [
              ClaimStatus.PENDING,
              ClaimStatus.VERIFICATION_SENT,
              ClaimStatus.VERIFIED,
            ],
          },
          createdAt: {
            gte: expiryThreshold,
            lt: warningThreshold,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
            },
          },
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      });

      if (warningClaims.length === 0) {
        this.logger.log('No claims approaching expiry');
        return;
      }

      this.logger.log(`Found ${warningClaims.length} claims approaching expiry`);

      let warningsSent = 0;

      for (const claim of warningClaims) {
        try {
          // Send warning notification
          this.eventEmitter.emit('notification.send', {
            type: 'CLAIM_EXPIRY_WARNING',
            recipient: claim.user?.email,
            data: {
              claimId: claim.id,
              businessName: claim.vendorProfile?.businessName,
              daysRemaining: CLAIM_EXPIRY_DAYS - CLAIM_WARNING_DAYS,
              firstName: claim.user?.firstName || 'User',
              status: claim.status,
            },
          });

          warningsSent++;
        } catch (error) {
          this.logger.error(
            `Failed to send expiry warning for claim ${claim.id}: ${(error as Error).message}`,
          );
        }
      }

      this.logger.log(`Sent ${warningsSent} claim expiry warnings`);
    } catch (error) {
      this.logger.error('Claim expiry warning job failed', error);
    }
  }

  // ============================================================================
  // VERIFICATION CODE EXPIRY
  // ============================================================================

  /**
   * Mark claims with expired verification codes
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async markExpiredVerificationCodes(): Promise<void> {
    this.logger.log('Checking for expired verification codes...');

    try {
      // Use the existing repository method
      const expiredCount = await this.vendorClaimRepository.markExpiredClaims();

      if (expiredCount > 0) {
        this.logger.log(`Marked ${expiredCount} claims with expired verification codes`);

        this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.EXPIRED, {
          count: expiredCount,
          reason: 'verification_code_expired',
        });
      }
    } catch (error) {
      this.logger.error('Failed to mark expired verification codes', error);
    }
  }

  // ============================================================================
  // GUEST CLAIM VERIFICATION CLEANUP
  // ============================================================================

  /**
   * Clean up expired guest claim verifications
   * Runs every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredGuestVerifications(): Promise<void> {
    this.logger.log('Cleaning up expired guest claim verifications...');

    try {
      const result = await this.prisma.guestClaimVerification.deleteMany({
        where: {
          verificationExpiry: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired guest claim verifications`);
      }
    } catch (error) {
      this.logger.error('Failed to clean up expired guest verifications', error);
    }
  }

  // ============================================================================
  // ADMIN REVIEW REMINDERS
  // ============================================================================

  /**
   * Send reminders to admins about pending claim reviews
   * Runs daily at 10:00 AM
   */
  @Cron('0 10 * * *') // Run daily at 10:00 AM
  async sendAdminReviewReminders(): Promise<void> {
    this.logger.log('Checking for claims pending admin review...');

    try {
      // Count claims in each reviewable status
      const [pendingCount, verificationSentCount, verifiedCount] = await Promise.all([
        this.vendorClaimRepository.countByStatus(ClaimStatus.PENDING),
        this.vendorClaimRepository.countByStatus(ClaimStatus.VERIFICATION_SENT),
        this.vendorClaimRepository.countByStatus(ClaimStatus.VERIFIED),
      ]);

      const totalPending = pendingCount + verificationSentCount + verifiedCount;

      if (totalPending === 0) {
        this.logger.log('No claims pending admin review');
        return;
      }

      // Find claims that have been waiting more than 3 days
      const urgentThreshold = subDays(new Date(), 3);
      const urgentClaims = await this.prisma.vendorClaim.count({
        where: {
          status: {
            in: [ClaimStatus.PENDING, ClaimStatus.VERIFIED],
          },
          createdAt: {
            lt: urgentThreshold,
          },
        },
      });

      this.logger.log(
        `Claims pending review: ${totalPending} total, ${urgentClaims} urgent (>3 days)`,
      );

      // Emit event for admin notification
      this.eventEmitter.emit('notification.send', {
        type: 'ADMIN_CLAIMS_PENDING_REVIEW',
        data: {
          totalPending,
          urgentCount: urgentClaims,
          breakdown: {
            pending: pendingCount,
            verificationSent: verificationSentCount,
            verified: verifiedCount,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to send admin review reminders', error);
    }
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Log scheduler health status
   * Runs every 6 hours
   */
  @Cron('0 */6 * * *')
  async healthCheck(): Promise<void> {
    this.logger.debug('Claim scheduler health check - OK');
  }
}
