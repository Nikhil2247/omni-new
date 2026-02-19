// ============================================================================
// BILLING SERVICE - Operations Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
// import { VendorBilling, PayoutStatus } from '@prisma/client' // Models don't exist
import type { Prisma } from '@prisma/client';
import { BillingRepository } from '../repositories';
import { Decimal } from '@prisma/client/runtime/client';

export interface CreateBillingDto {
  vendorProfileId: string;
  amount: number;
  description: string;
  referenceId?: string;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateBillingDto): Promise<any> {
    this.logger.log(
      `Creating billing record for vendor: ${dto.vendorProfileId}`,
    );

    const billing = await this.billingRepository.create({
      vendorProfile: { connect: { id: dto.vendorProfileId } },
      amount: new Decimal(dto.amount),
      description: dto.description,
      referenceId: dto.referenceId,
      status: 'PENDING',
    });

    this.eventEmitter.emit('billing.created', {
      billingId: billing.id,
      vendorProfileId: dto.vendorProfileId,
      amount: dto.amount,
    });

    return billing;
  }

  async findById(id: string): Promise<any> {
    const billing = await this.billingRepository.findById(id);
    if (!billing) {
      throw new NotFoundException('Billing record not found');
    }
    return billing;
  }

  async findByVendor(vendorProfileId: string) {
    return this.billingRepository.findByVendor(vendorProfileId);
  }

  async findByStatus(status: any /* PayoutStatus */) {
    return this.billingRepository.findByStatus(status);
  }

  async startProcessing(id: string): Promise<any> {
    const billing = await this.findById(id);

    if (billing.status !== 'PENDING') {
      throw new ConflictException('Can only process PENDING billing records');
    }

    return this.billingRepository.update(id, { status: 'PROCESSING' });
  }

  async markAsPaid(id: string, transactionId?: string): Promise<any> {
    const billing = await this.findById(id);

    const updated = await this.billingRepository.update(id, {
      status: 'PAID',
      paidAt: new Date(),
      transactionId,
    });

    this.eventEmitter.emit('billing.paid', {
      billingId: id,
      vendorProfileId: billing.vendorProfileId,
      amount: Number(billing.amount),
    });

    return updated;
  }

  async markAsFailed(id: string, failureReason: string): Promise<any> {
    await this.findById(id);

    return this.billingRepository.update(id, {
      status: 'FAILED',
      failureReason,
    });
  }

  async getPendingPayouts() {
    return this.billingRepository.getPendingPayouts();
  }

  async getVendorEarnings(vendorProfileId: string) {
    const totalEarnings =
      await this.billingRepository.getTotalEarnings(vendorProfileId);
    const pendingAmount =
      await this.billingRepository.getPendingAmount(vendorProfileId);

    return {
      totalEarnings,
      pendingAmount,
      paidAmount: totalEarnings,
    };
  }
}

class ConflictException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictException';
  }
}
