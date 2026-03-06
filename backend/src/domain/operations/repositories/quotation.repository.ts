// ============================================================================
// QUOTATION REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { Quotation, Prisma, QuotationStatus } from '@prisma/client';

@Injectable()
export class QuotationRepository extends BaseRepository<
  Quotation,
  Prisma.QuotationCreateInput,
  Prisma.QuotationUpdateInput,
  Prisma.QuotationWhereInput,
  Prisma.QuotationWhereUniqueInput,
  Prisma.QuotationOrderByWithRelationInput
> {
  protected readonly modelName = 'Quotation';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.quotation;
  }

  async findByAgreement(vendorAgreementId: string) {
    return this.model.findUnique({
      where: { vendorAgreementId },
      include: {
        vendorAgreement: {
          include: {
            activeEvent: {
              select: {
                id: true,
                clientName: true,
                clientEmail: true,
                clientPhone: true,
                eventType: true,
                eventDate: true,
                venueName: true,
              },
            },
          },
        },
        invoice: true,
      },
    });
  }

  async findByStatus(status: QuotationStatus) {
    return this.model.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async findAll(params?: {
    vendorAgreementId?: string;
    activeEventId?: string;
    status?: QuotationStatus;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.QuotationWhereInput = {};

    if (params?.vendorAgreementId) {
      where.vendorAgreementId = params.vendorAgreementId;
    }
    if (params?.activeEventId) {
      where.vendorAgreement = {
        activeEventId: params.activeEventId,
      };
    }
    if (params?.status) {
      where.status = params.status;
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendorAgreement: {
            include: {
              activeEvent: {
                select: {
                  id: true,
                  clientName: true,
                  eventType: true,
                  eventDate: true,
                  venueName: true,
                },
              },
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
            },
          },
        },
      }),
      this.model.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByIdWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        vendorAgreement: {
          include: {
            activeEvent: {
              select: {
                id: true,
                clientName: true,
                clientEmail: true,
                clientPhone: true,
                eventType: true,
                eventDate: true,
                venueName: true,
                totalBudget: true,
              },
            },
          },
        },
        invoice: true,
      },
    });
  }

  async generateQuotationNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `QUO-${timestamp}-${random}`;
  }

  async findExpiredQuotations() {
    return this.model.findMany({
      where: {
        status: 'SENT',
        validUntil: {
          lt: new Date(),
        },
      },
    });
  }

  async markAsExpired(ids: string[]) {
    return this.model.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }
}
