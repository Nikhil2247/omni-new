// ============================================================================
// OPS DASHBOARD SERVICE - Operations Domain
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

export interface DashboardMetrics {
  activeEvents: {
    total: number;
    byStatus: Record<string, number>;
  };
  kyc: {
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
  disputes: {
    open: number;
    investigating: number;
    resolved: number;
  };
  billing: {
    pendingPayouts: number;
    totalPendingAmount: number;
  };
  tasks: {
    totalAssigned: number;
    completed: number;
    overdue: number;
  };
}

@Injectable()
export class OpsDashboardService {
  private readonly logger = new Logger(OpsDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<DashboardMetrics> {
    this.logger.log('Fetching ops dashboard metrics');

    const [
      activeEventsTotal,
      kycMetrics,
      disputeMetrics,
      billingMetrics,
      taskMetrics,
    ] = await Promise.all([
      this.getActiveEventsMetrics(),
      this.getKycMetrics(),
      this.getDisputeMetrics(),
      this.getBillingMetrics(),
      this.getTaskMetrics(),
    ]);

    return {
      activeEvents: activeEventsTotal,
      kyc: kycMetrics,
      disputes: disputeMetrics,
      billing: billingMetrics,
      tasks: taskMetrics,
    };
  }

  private async getActiveEventsMetrics() {
    const total = await this.prisma.activeEvent.count();

    const byStatus = await this.prisma.activeEvent.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusMap = byStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { total, byStatus: statusMap };
  }

  private async getKycMetrics() {
    const kycCounts = await this.prisma.vendorKYC.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const countByStatus = Object.fromEntries(
      kycCounts.map(m => [m.status, m._count._all])
    );

    const pending = countByStatus['PENDING'] ?? 0;
    const underReview = countByStatus['UNDER_REVIEW'] ?? 0;
    const approved = countByStatus['APPROVED'] ?? 0;
    const rejected = countByStatus['REJECTED'] ?? 0;

    return { pending, underReview, approved, rejected };
  }

  private async getDisputeMetrics() {
    const disputeCounts = await this.prisma.dispute.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const countByStatus = Object.fromEntries(
      disputeCounts.map(m => [m.status, m._count._all])
    );

    const open = countByStatus['OPEN'] ?? 0;
    const investigating = countByStatus['INVESTIGATING'] ?? 0;
    const resolved = countByStatus['RESOLVED'] ?? 0;

    return { open, investigating, resolved };
  }

  private async getBillingMetrics() {
    // VendorBilling model doesn't exist - return mock data
    // const pendingPayouts = await this.prisma.vendorBilling.count({
    //   where: { status: { in: ['PENDING', 'PROCESSING'] } },
    // })
    // const totalPending = await this.prisma.vendorBilling.aggregate({
    //   where: { status: { in: ['PENDING', 'PROCESSING'] } },
    //   _sum: { amount: true },
    // })

    return {
      pendingPayouts: 0,
      totalPendingAmount: 0,
    };
  }

  private async getTaskMetrics() {
    const taskCounts = await this.prisma.operationalTask.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const countByStatus = Object.fromEntries(
      taskCounts.map(m => [m.status, m._count._all])
    );

    const totalAssigned = taskCounts.reduce((sum, item) => sum + item._count._all, 0);
    const completed = countByStatus['COMPLETED'] ?? 0;

    const overdue = await this.prisma.operationalTask.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETED' },
      },
    });

    return { totalAssigned, completed, overdue };
  }
}
