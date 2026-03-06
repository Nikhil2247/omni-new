// ============================================================================
// PROVISIONAL INVOICE REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import {
  ProvisionalInvoice,
  Prisma,
  ProvisionalInvoiceStatus,
} from '@prisma/client';

@Injectable()
export class ProvisionalInvoiceRepository extends BaseRepository<
  ProvisionalInvoice,
  Prisma.ProvisionalInvoiceCreateInput,
  Prisma.ProvisionalInvoiceUpdateInput,
  Prisma.ProvisionalInvoiceWhereInput,
  Prisma.ProvisionalInvoiceWhereUniqueInput,
  Prisma.ProvisionalInvoiceOrderByWithRelationInput
> {
  protected readonly modelName = 'ProvisionalInvoice';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.provisionalInvoice;
  }

  async findByAgreement(vendorAgreementId: string) {
    return this.model.findUnique({
      where: { vendorAgreementId },
    });
  }

  async findByStatus(status: ProvisionalInvoiceStatus) {
    return this.model.findMany({
      where: { status },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findAll(params?: {
    status?: ProvisionalInvoiceStatus;
    activeEventId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.ProvisionalInvoiceWhereInput = {};
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.activeEventId) {
      where.vendorAgreement = {
        activeEventId: params.activeEventId,
      };
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          vendorAgreement: {
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
          },
        },
      }),
      this.model.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
