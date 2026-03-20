// ============================================================================
// LEAD SERVICE - Leads Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead, Prisma, LeadStatus } from '@prisma/client';
import { LeadRepository } from '../repositories/lead.repository';
import { CreateLeadDto, UpdateLeadDto, SearchLeadsDto } from '../dto/lead.dto';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';
import { Decimal } from '@prisma/client/runtime/client';
import { ConversationService } from '../../messaging/services/conversation.service';
import { MessagingMessageService } from '../../messaging/services/message.service';
import { PrismaService } from '../../../core/database/prisma.service';

// Type for Lead with included relations
export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    vendorProfile: {
      select: {
        id: true;
        businessName: true;
        slug: true;
      };
    };
    planner: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        phone: true;
      };
    };
    messages: true;
  };
}>;

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly conversationService: ConversationService,
    private readonly messagingMessageService: MessagingMessageService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    this.logger.log(
      `Creating lead for vendor: ${dto.vendorProfileId} from planner: ${dto.plannerId}`,
    );

    // Check for duplicate lead creation (prevent double-click)
    const duplicateCheckTime = new Date(Date.now() - 60000); // Last 60 seconds
    const existingLead = await this.prisma.lead.findFirst({
      where: {
        plannerId: dto.plannerId,
        vendorProfileId: dto.vendorProfileId,
        ...(dto.eventId && { eventId: dto.eventId }),
        createdAt: { gte: duplicateCheckTime },
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
        planner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (existingLead) {
      this.logger.warn(
        `Duplicate lead creation prevented for planner ${dto.plannerId} and vendor ${dto.vendorProfileId}`,
      );
      return existingLead;
    }

    // Fetch vendor profile to get userId
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: dto.vendorProfileId },
      select: { userId: true },
    });

    if (!vendorProfile) {
      this.logger.error(`Vendor profile not found: ${dto.vendorProfileId}`);
      throw new NotFoundException('Vendor profile not found');
    }

    if (!vendorProfile.userId) {
      this.logger.error(`Vendor profile has no associated user: ${dto.vendorProfileId}`);
      throw new NotFoundException('Vendor profile has no associated user (unclaimed vendor)');
    }

    const vendorUserId = vendorProfile.userId; // Capture non-null value for use in transaction
    this.logger.debug(`Vendor profile userId: ${vendorUserId}`);

    // Validate both users exist before creating conversation
    const [plannerUser, vendorUser] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.plannerId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: vendorUserId },
        select: { id: true },
      }),
    ]);

    this.logger.debug(`Planner user found: ${!!plannerUser}, Vendor user found: ${!!vendorUser}`);

    if (!plannerUser) {
      this.logger.error(`Planner user not found: ${dto.plannerId}`);
      throw new NotFoundException(`Planner user not found: ${dto.plannerId}`);
    }

    if (!vendorUser) {
      this.logger.error(`Vendor user not found: ${vendorUserId}`);
      throw new NotFoundException(`Vendor user not found: ${vendorUserId}`);
    }

    this.logger.debug('Both users validated successfully');

    // Wrap entire lead creation flow in transaction for atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create lead
      const lead = await tx.lead.create({
        data: {
          vendorProfile: { connect: { id: dto.vendorProfileId } },
          planner: { connect: { id: dto.plannerId } },
          event: dto.eventId ? { connect: { id: dto.eventId } } : undefined,
          source: dto.source,
          status: 'NEW',
          eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
          eventType: dto.eventType,
          guestCount: dto.guestCount,
          budget: dto.budget ? new Decimal(dto.budget) : undefined,
          initialMessage: dto.initialMessage,
        },
        include: {
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              slug: true,
            },
          },
          planner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create conversation for lead using vendor's userId
      const conversation = await tx.conversation.create({
        data: {
          type: 'LEAD',
          lead: { connect: { id: lead.id } },
          participants: {
            create: [
              {
                userId: dto.plannerId,
                role: 'PLANNER',
              },
              {
                userId: vendorUserId,
                role: 'VENDOR',
              },
            ],
          },
        },
        include: {
          participants: true,
        },
      });

      // Send initial message if provided
      if (dto.initialMessage) {
        await tx.message.create({
          data: {
            conversation: { connect: { id: conversation.id } },
            sender: { connect: { id: dto.plannerId } },
            content: dto.initialMessage,
          },
        });

        // Update conversation lastMessageAt
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      }

      return lead;
    });

    // Emit event after successful transaction commit
    this.eventEmitter.emit('lead.created', {
      leadId: result.id,
      vendorProfileId: dto.vendorProfileId,
      plannerId: dto.plannerId,
      source: dto.source,
    });

    this.logger.log(`Lead created successfully: ${result.id}`);

    return result;
  }

  async findById(id: string): Promise<LeadWithRelations> {
    const lead = (await this.leadRepository.findById(id, {
      vendorProfile: {
        select: {
          id: true,
          businessName: true,
          slug: true,
        },
      },
      planner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 10,
      },
    })) as LeadWithRelations;

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async findByVendorProfile(
    vendorProfileId: string,
    status?: string,
  ): Promise<Lead[]> {
    return this.leadRepository.findByVendorProfile(vendorProfileId, status);
  }

  async findByPlanner(plannerId: string): Promise<Lead[]> {
    return this.leadRepository.findByPlanner(plannerId);
  }

  async search(dto: SearchLeadsDto): Promise<PaginatedResult<Lead>> {
    return this.leadRepository.search(dto);
  }

  /**
   * Update lead status atomically with optimistic locking
   * Prevents race conditions when multiple requests try to update status
   */
  async updateStatusAtomic(
    id: string,
    newStatus: LeadStatus,
    expectedCurrentStatus?: LeadStatus,
  ): Promise<Lead> {
    const lead = await this.findById(id);

    // If expected status is provided, use optimistic locking
    if (expectedCurrentStatus) {
      const result = await this.prisma.$executeRaw`
        UPDATE interaction."leads"
        SET status = ${newStatus}::"interaction"."LeadStatus",
            "updated_at" = NOW()
        WHERE id = ${id}
          AND status = ${expectedCurrentStatus}::"interaction"."LeadStatus"
          AND "deleted_at" IS NULL
      `;

      if (result === 0) {
        throw new ConflictException(
          `Lead status has changed. Expected ${expectedCurrentStatus} but found ${lead.status}`,
        );
      }
    } else {
      // No optimistic lock, just update
      await this.leadRepository.update(id, { status: newStatus });
    }

    // Fetch updated lead
    const updated = await this.findById(id);

    // Emit status change event
    this.eventEmitter.emit('lead.status-changed', {
      leadId: id,
      oldStatus: lead.status,
      newStatus,
      vendorProfileId: lead.vendorProfileId,
      plannerId: lead.plannerId,
    });

    // Handle conversion
    if (newStatus === 'WON') {
      await this.leadRepository.update(id, { convertedAt: new Date() });
      this.eventEmitter.emit('lead.converted', { leadId: id });
    }

    return updated;
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findById(id);
    const oldStatus = lead.status;

    // If status is being changed, use atomic update
    if (dto.status && dto.status !== oldStatus) {
      return this.updateStatusAtomic(id, dto.status as LeadStatus);
    }

    // Otherwise, update non-status fields normally
    const updated = await this.leadRepository.update(id, {
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      eventType: dto.eventType,
      guestCount: dto.guestCount,
      budget: dto.budget ? new Decimal(dto.budget) : undefined,
    });

    return updated;
  }

  async linkEvent(leadId: string, eventId: string): Promise<Lead> {
    return this.leadRepository.update(leadId, {
      event: { connect: { id: eventId } },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.leadRepository.delete(id);
    this.eventEmitter.emit('lead.deleted', { leadId: id });
  }

  async markAsContacted(id: string): Promise<Lead> {
    const lead = await this.findById(id);

    if (lead.status === 'NEW') {
      // Use atomic update with optimistic locking
      const updated = await this.updateStatusAtomic(id, 'CONTACTED', 'NEW');

      // Update responded timestamp
      await this.leadRepository.update(id, {
        respondedAt: new Date(),
      });

      this.eventEmitter.emit('lead.contacted', { leadId: id });
      return updated;
    }

    return lead;
  }

  async getUnreadCount(vendorProfileId: string): Promise<number> {
    return this.leadRepository.getUnreadCount(vendorProfileId);
  }
}
