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
    const [pending, underReview, approved, rejected] = await Promise.all([
      this.prisma.vendorKYC.count({ where: { status: 'PENDING' } }),
      this.prisma.vendorKYC.count({ where: { status: 'UNDER_REVIEW' } }),
      this.prisma.vendorKYC.count({ where: { status: 'APPROVED' } }),
      this.prisma.vendorKYC.count({ where: { status: 'REJECTED' } }),
    ]);

    return { pending, underReview, approved, rejected };
  }

  private async getDisputeMetrics() {
    const [open, investigating, resolved] = await Promise.all([
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
      this.prisma.dispute.count({ where: { status: 'INVESTIGATING' } }),
      this.prisma.dispute.count({ where: { status: 'RESOLVED' } }),
    ]);

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
    const totalAssigned = await this.prisma.operationalTask.count();
    const completed = await this.prisma.operationalTask.count({
      where: { status: 'COMPLETED' },
    });
    const overdue = await this.prisma.operationalTask.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETED' },
      },
    });

    return { totalAssigned, completed, overdue };
  }
}
