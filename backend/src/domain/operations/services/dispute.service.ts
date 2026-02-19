// ============================================================================
// DISPUTE SERVICE - Operations Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Dispute, DisputeStatus, DisputeType } from '@prisma/client';
import { DisputeRepository } from '../repositories';

export interface CreateDisputeDto {
  vendorProfileId: string;
  reporterId: string;
  type: DisputeType;
  description: string;
}

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly disputeRepository: DisputeRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateDisputeDto): Promise<Dispute> {
    this.logger.log(`Creating dispute against vendor: ${dto.vendorProfileId}`);

    const dispute = await this.disputeRepository.create({
      vendorProfileId: dto.vendorProfileId,
      reporterId: dto.reporterId,
      type: dto.type,
      description: dto.description,
      status: 'OPEN',
    });

    this.eventEmitter.emit('dispute.created', {
      disputeId: dispute.id,
      vendorProfileId: dto.vendorProfileId,
      type: dto.type,
    });

    return dispute;
  }

  async findById(id: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findById(id);
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  async findByVendor(vendorProfileId: string) {
    return this.disputeRepository.findByVendor(vendorProfileId);
  }

  async findByReporter(reporterId: string) {
    return this.disputeRepository.findByReporter(reporterId);
  }

  async findByStatus(status: DisputeStatus) {
    return this.disputeRepository.findByStatus(status);
  }

  async findAll() {
    return this.disputeRepository.search({}, { take: 100 });
  }

  async startInvestigation(id: string): Promise<Dispute> {
    const dispute = await this.findById(id);

    if (dispute.status !== 'OPEN') {
      throw new ConflictException('Can only investigate OPEN disputes');
    }

    return this.disputeRepository.update(id, { status: 'INVESTIGATING' });
  }

  async resolve(
    id: string,
    resolution: string,
    resolvedBy: string,
  ): Promise<Dispute> {
    await this.findById(id);

    const updated = await this.disputeRepository.update(id, {
      status: 'RESOLVED',
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
    });

    this.eventEmitter.emit('dispute.resolved', { disputeId: id, resolvedBy });
    return updated;
  }

  async escalate(id: string): Promise<Dispute> {
    await this.findById(id);

    const updated = await this.disputeRepository.update(id, {
      status: 'ESCALATED',
    });
    this.eventEmitter.emit('dispute.escalated', { disputeId: id });
    return updated;
  }

  async getOpenDisputesCount(): Promise<number> {
    return this.disputeRepository.getOpenDisputesCount();
  }
}

class ConflictException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictException';
  }
}
