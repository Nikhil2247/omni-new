// ============================================================================
// SESSION CLEANUP TASK - Scheduled Session Maintenance
// ============================================================================
// Periodically cleans up expired and revoked sessions from the database
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from '../token.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SessionCleanupTask {
  private readonly logger = new Logger(SessionCleanupTask.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Clean up expired sessions every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions(): Promise<void> {
    this.logger.log('Starting session cleanup task...');

    try {
      const deletedCount = await this.tokenService.cleanupExpiredSessions();
      this.logger.log(
        `Session cleanup completed. Removed ${deletedCount} sessions.`,
      );
    } catch (error) {
      this.logger.error('Session cleanup task failed', error);
    }
  }

  /**
   * Clean up old login activities (older than 90 days) - runs daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLoginActivities(): Promise<void> {
    this.logger.log('Starting login activity cleanup task...');

    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

      const result = await this.prisma.loginActivity.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      this.logger.log(
        `Login activity cleanup completed. Removed ${result.count} records.`,
      );
    } catch (error) {
      this.logger.error('Login activity cleanup task failed', error);
    }
  }

  /**
   * Clean up expired API keys - runs daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupExpiredApiKeys(): Promise<void> {
    this.logger.log('Starting API key cleanup task...');

    try {
      // Mark expired keys as inactive (don't delete for audit purposes)
      const result = await this.prisma.apiKey.updateMany({
        where: {
          isActive: true,
          expiresAt: { lt: new Date() },
        },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      });

      this.logger.log(
        `API key cleanup completed. Deactivated ${result.count} expired keys.`,
      );

      // Delete very old revoked keys (older than 1 year)
      const oldKeysCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const deleteResult = await this.prisma.apiKey.deleteMany({
        where: {
          isActive: false,
          revokedAt: { lt: oldKeysCutoff },
        },
      });

      if (deleteResult.count > 0) {
        this.logger.log(`Removed ${deleteResult.count} old revoked API keys.`);
      }
    } catch (error) {
      this.logger.error('API key cleanup task failed', error);
    }
  }

  /**
   * Clean up unverified accounts older than 7 days - runs daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async cleanupUnverifiedAccounts(): Promise<void> {
    this.logger.log('Starting unverified account cleanup task...');

    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      // Get count first for logging
      const unverifiedCount = await this.prisma.user.count({
        where: {
          emailVerified: false,
          status: 'PENDING',
          createdAt: { lt: cutoffDate },
        },
      });

      if (unverifiedCount > 0) {
        // Soft delete by updating status
        const result = await this.prisma.user.updateMany({
          where: {
            emailVerified: false,
            status: 'PENDING',
            createdAt: { lt: cutoffDate },
          },
          data: {
            status: 'DELETED',
            deletedAt: new Date(),
          },
        });

        this.logger.log(
          `Unverified account cleanup completed. Marked ${result.count} accounts as deleted.`,
        );
      } else {
        this.logger.debug('No unverified accounts to clean up.');
      }
    } catch (error) {
      this.logger.error('Unverified account cleanup task failed', error);
    }
  }
}
