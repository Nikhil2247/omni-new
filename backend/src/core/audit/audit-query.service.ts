// ============================================================================
// AUDIT QUERY SERVICE - Querying and Analyzing Audit Logs
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AuditQueryOptions,
  AuditCategory,
  PaginatedAuditLogs,
} from './audit.types';

@Injectable()
export class AuditQueryService {
  private readonly logger = new Logger(AuditQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query audit logs with filters and pagination
   */
  async queryLogs(
    options: AuditQueryOptions,
  ): Promise<PaginatedAuditLogs<any>> {
    const {
      page = 1,
      limit = 50,
      userId,
      entityType,
      entityId,
      category,
      action,
      ipAddress,
      startDate,
      endDate,
    } = options;

    const where: any = {};

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (ipAddress) where.ipAddress = ipAddress;

    // Filter by category (action starts with category)
    if (category) {
      where.action = { startsWith: `${category}:` };
    }

    // Filter by specific action
    if (action) {
      where.action = { contains: action };
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get entity history (all changes to a specific entity)
   */
  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user activity timeline
   */
  async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get recent activity by entity type
   */
  async getRecentByEntityType(entityType: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { entityType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit statistics for dashboard
   */
  async getStatistics(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalLogs, logsByCategory, topUsers, topEntities] =
      await Promise.all([
        // Total logs count
        this.prisma.auditLog.count({
          where: { createdAt: { gte: startDate } },
        }),

        // Logs grouped by category (using action prefix)
        this.prisma.auditLog.groupBy({
          by: ['action'],
          where: { createdAt: { gte: startDate } },
          _count: true,
        }),

        // Top users by activity
        this.prisma.auditLog.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: startDate },
            userId: { not: null },
          },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10,
        }),

        // Top entity types
        this.prisma.auditLog.groupBy({
          by: ['entityType'],
          where: { createdAt: { gte: startDate } },
          _count: true,
          orderBy: { _count: { entityType: 'desc' } },
          take: 10,
        }),
      ]);

    // Process category counts
    const categoryStats: Record<string, number> = {};
    for (const log of logsByCategory) {
      const category = log.action.split(':')[0] || 'OTHER';
      categoryStats[category] = (categoryStats[category] || 0) + log._count;
    }

    return {
      totalLogs,
      byCategory: categoryStats,
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        count: u._count,
      })),
      topEntities: topEntities.map((e) => ({
        entityType: e.entityType,
        count: e._count,
      })),
      period: { startDate, endDate: new Date() },
    };
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    options: {
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {},
  ) {
    const where: any = {
      action: { startsWith: `${AuditCategory.SECURITY}:` },
    };

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
    });
  }

  /**
   * Get authentication events
   */
  async getAuthenticationEvents(
    options: {
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {},
  ) {
    const where: any = {
      action: { startsWith: `${AuditCategory.AUTHENTICATION}:` },
    };

    if (options.userId) where.userId = options.userId;
    if (options.action) where.action = { contains: options.action };

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
    });
  }

  /**
   * Get failed login attempts
   */
  async getFailedLogins(
    options: {
      ipAddress?: string;
      startDate?: Date;
      limit?: number;
    } = {},
  ) {
    const startDate =
      options.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: any = {
      action: `${AuditCategory.AUTHENTICATION}:LOGIN_FAILED`,
      createdAt: { gte: startDate },
    };

    if (options.ipAddress) where.ipAddress = options.ipAddress;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
    });
  }

  /**
   * Export audit logs for compliance
   */
  async exportForCompliance(options: {
    startDate: Date;
    endDate: Date;
    categories?: AuditCategory[];
    userId?: string;
  }) {
    const where: any = {
      createdAt: {
        gte: options.startDate,
        lte: options.endDate,
      },
    };

    if (options.userId) where.userId = options.userId;

    if (options.categories?.length) {
      where.OR = options.categories.map((cat) => ({
        action: { startsWith: `${cat}:` },
      }));
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get audit trail for a specific record
   */
  async getAuditTrail(entityType: string, entityId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build a timeline of changes
    return logs.map((log) => ({
      timestamp: log.createdAt,
      action: log.action.split(':')[1] || log.action,
      userId: log.userId,
      ipAddress: log.ipAddress,
      oldValue: log.oldValue,
      newValue: log.newValue,
    }));
  }

  /**
   * Search audit logs by keyword
   */
  async searchLogs(
    keyword: string,
    options: { limit?: number; page?: number } = {},
  ) {
    const limit = options.limit || 50;
    const page = options.page || 1;

    // Search in action and entity type
    const where = {
      OR: [
        { action: { contains: keyword, mode: 'insensitive' as const } },
        { entityType: { contains: keyword, mode: 'insensitive' as const } },
      ],
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
