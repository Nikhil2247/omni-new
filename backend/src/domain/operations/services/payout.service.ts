// ============================================================================
// PAYOUT SERVICE - Operations Domain
// ============================================================================
// Manages vendor payout calculations, scheduling, and processing
// Commission is taken from VendorContract, payouts tracked via PayoutRecord

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PayoutRecord, PayoutRecordStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

export interface CreatePayoutDto {
  vendorProfileId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface PayoutSummary {
  vendorProfileId: string;
  totalEarnings: number;
  totalCommission: number;
  netPayout: number;
  eventCount: number;
  agreements: Array<{
    id: string;
    agreedAmount: number;
    eventName: string;
    eventDate: Date | null;
  }>;
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Calculate payout summary for a vendor in a given period
   * Commission is calculated from VendorContract rate
   */
  async calculatePayoutSummary(
    vendorProfileId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PayoutSummary> {
    // Get vendor contract for commission rate
    const contract = await this.prisma.vendorContract.findUnique({
      where: { vendorProfileId },
    });

    const commissionRate = contract ? Number(contract.commissionRate) : 0;

    // Get completed agreements for this vendor in the period
    const agreements = await this.prisma.vendorAgreement.findMany({
      where: {
        vendorProfileId,
        status: 'COMPLETED',
        activeEvent: {
          eventDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
      include: {
        activeEvent: {
          select: {
            id: true,
            clientName: true,
            eventType: true,
            eventDate: true,
          },
        },
      },
    });

    let totalEarnings = 0;

    const agreementDetails = agreements.map((agreement) => {
      const agreedAmount = Number(agreement.agreedAmount);
      totalEarnings += agreedAmount;

      return {
        id: agreement.id,
        agreedAmount,
        eventName: `${agreement.activeEvent.clientName} - ${agreement.activeEvent.eventType}`,
        eventDate: agreement.activeEvent.eventDate,
      };
    });

    // Calculate commission from contract rate
    const totalCommission = totalEarnings * (commissionRate / 100);
    const netPayout = totalEarnings - totalCommission;

    return {
      vendorProfileId,
      totalEarnings,
      totalCommission,
      netPayout,
      eventCount: agreements.length,
      agreements: agreementDetails,
    };
  }

  /**
   * Create a payout record for a vendor
   */
  async createPayout(dto: CreatePayoutDto): Promise<PayoutRecord> {
    this.logger.log(`Creating payout for vendor: ${dto.vendorProfileId}`);

    // Get vendor contract for commission details
    const contract = await this.prisma.vendorContract.findUnique({
      where: { vendorProfileId: dto.vendorProfileId },
    });

    if (!contract) {
      throw new NotFoundException('No active contract found for vendor');
    }

    if (contract.status !== 'ACTIVE') {
      throw new BadRequestException('Vendor contract is not active');
    }

    // Calculate payout summary
    const summary = await this.calculatePayoutSummary(
      dto.vendorProfileId,
      dto.periodStart,
      dto.periodEnd,
    );

    if (summary.eventCount === 0) {
      throw new BadRequestException('No completed events in this period');
    }

    // Check minimum payout threshold
    if (summary.netPayout < Number(contract.minPayoutAmount)) {
      throw new BadRequestException(
        `Net payout (${summary.netPayout}) is below minimum threshold (${contract.minPayoutAmount})`,
      );
    }

    // Create payout record
    const payout = await this.prisma.payoutRecord.create({
      data: {
        contractId: contract.id,
        vendorProfileId: dto.vendorProfileId,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        // Required fields
        grossAmount: summary.totalEarnings,
        commissionAmount: summary.totalCommission,
        netAmount: summary.netPayout,
        // Optional duplicate fields for compatibility
        grossEarnings: summary.totalEarnings,
        totalCommission: summary.totalCommission,
        netPayout: summary.netPayout,
        eventCount: summary.eventCount,
        status: PayoutRecordStatus.PENDING,
      },
    });

    this.eventEmitter.emit('payout.created', {
      payoutId: payout.id,
      vendorProfileId: dto.vendorProfileId,
      netPayout: summary.netPayout,
    });

    return payout;
  }

  /**
   * Schedule payout for processing
   */
  async schedulePayout(
    payoutId: string,
    scheduledFor: Date,
  ): Promise<PayoutRecord> {
    const payout = await this.findById(payoutId);

    if (payout.status !== PayoutRecordStatus.PENDING) {
      throw new BadRequestException(
        'Payout must be in PENDING status to schedule',
      );
    }

    return this.prisma.payoutRecord.update({
      where: { id: payoutId },
      data: {
        status: PayoutRecordStatus.SCHEDULED,
        scheduledFor,
      },
    });
  }

  /**
   * Process payout (mark as processing)
   */
  async processPayout(payoutId: string): Promise<PayoutRecord> {
    const payout = await this.findById(payoutId);

    if (payout.status !== PayoutRecordStatus.SCHEDULED) {
      throw new BadRequestException(
        'Payout must be in SCHEDULED status to process',
      );
    }

    return this.prisma.payoutRecord.update({
      where: { id: payoutId },
      data: {
        status: PayoutRecordStatus.PROCESSING,
      },
    });
  }

  /**
   * Complete payout
   */
  async completePayout(
    payoutId: string,
    transactionRef: string,
    paymentMethod: string,
  ): Promise<PayoutRecord> {
    const payout = await this.findById(payoutId);

    if (payout.status !== PayoutRecordStatus.PROCESSING) {
      throw new BadRequestException(
        'Payout must be in PROCESSING status to complete',
      );
    }

    const updated = await this.prisma.payoutRecord.update({
      where: { id: payoutId },
      data: {
        status: PayoutRecordStatus.COMPLETED,
        processedAt: new Date(),
        transactionRef,
        paymentMethod,
      },
    });

    this.eventEmitter.emit('payout.completed', {
      payoutId,
      vendorProfileId: payout.vendorProfileId,
      netPayout: payout.netPayout,
      transactionRef,
    });

    return updated;
  }

  /**
   * Mark payout as failed
   */
  async failPayout(payoutId: string, reason: string): Promise<PayoutRecord> {
    const payout = await this.findById(payoutId);

    const updated = await this.prisma.payoutRecord.update({
      where: { id: payoutId },
      data: {
        status: PayoutRecordStatus.FAILED,
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    this.eventEmitter.emit('payout.failed', {
      payoutId,
      vendorProfileId: payout.vendorProfileId,
      reason,
    });

    return updated;
  }

  /**
   * Find payout by ID
   */
  async findById(id: string): Promise<PayoutRecord> {
    const payout = await this.prisma.payoutRecord.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            vendorProfile: {
              select: {
                id: true,
                businessName: true,
                contactEmail: true,
              },
            },
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout record not found');
    }

    return payout;
  }

  /**
   * Get payouts for a vendor
   */
  async getVendorPayouts(
    vendorProfileId: string,
    status?: PayoutRecordStatus,
  ): Promise<PayoutRecord[]> {
    const where: any = { vendorProfileId };
    if (status) {
      where.status = status;
    }

    return this.prisma.payoutRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pending payouts (for ops dashboard)
   */
  async getPendingPayouts(): Promise<PayoutRecord[]> {
    return this.prisma.payoutRecord.findMany({
      where: {
        status: {
          in: [PayoutRecordStatus.PENDING, PayoutRecordStatus.SCHEDULED],
        },
      },
      include: {
        contract: {
          include: {
            vendorProfile: {
              select: {
                id: true,
                businessName: true,
                contactEmail: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get payout statistics
   */
  async getPayoutStats(startDate: Date, endDate: Date) {
    const payouts = await this.prisma.payoutRecord.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      totalPayouts: payouts.length,
      totalAmount: 0,
      totalCommission: 0,
      byStatus: {} as Record<
        PayoutRecordStatus,
        { count: number; amount: number }
      >,
    };

    for (const payout of payouts) {
      stats.totalAmount += Number(payout.netPayout);
      stats.totalCommission += Number(payout.totalCommission);

      if (!stats.byStatus[payout.status]) {
        stats.byStatus[payout.status] = { count: 0, amount: 0 };
      }
      stats.byStatus[payout.status].count++;
      stats.byStatus[payout.status].amount += Number(payout.netPayout);
    }

    return stats;
  }
}
