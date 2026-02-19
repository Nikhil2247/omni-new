// ============================================================================
// LEAD SERVICE - Leads Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead, Prisma } from '@prisma/client';
import { LeadRepository } from '../repositories/lead.repository';
import { CreateLeadDto, UpdateLeadDto, SearchLeadsDto } from '../dto/lead.dto';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';
import { Decimal } from '@prisma/client/runtime/client';
import { ConversationService } from '../../messaging/services/conversation.service';
import { MessagingMessageService } from '../../messaging/services/message.service';

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
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    this.logger.log(
      `Creating lead for vendor: ${dto.vendorProfileId} from planner: ${dto.plannerId}`,
    );

    const lead = await this.leadRepository.create(
      {
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
      {
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
    );

    this.eventEmitter.emit('lead.created', {
      leadId: lead.id,
      vendorProfileId: dto.vendorProfileId,
      plannerId: dto.plannerId,
      source: dto.source,
    });

    try {
      const conversation =
        await this.conversationService.createLeadConversation(
          lead.id,
          dto.plannerId,
          dto.vendorProfileId,
        );

      if (dto.initialMessage) {
        await this.messagingMessageService.sendMessage(dto.plannerId, {
          conversationId: conversation.id,
          content: dto.initialMessage,
        });
      }
    } catch (error) {
      this.logger.error('Failed to initialize lead conversation', error);
    }

    return lead;
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

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findById(id);
    const oldStatus = lead.status;

    const updated = await this.leadRepository.update(id, {
      status: dto.status,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      eventType: dto.eventType,
      guestCount: dto.guestCount,
      budget: dto.budget ? new Decimal(dto.budget) : undefined,
    });

    if (dto.status && dto.status !== oldStatus) {
      this.eventEmitter.emit('lead.status-changed', {
        leadId: id,
        oldStatus,
        newStatus: dto.status,
        vendorProfileId: lead.vendorProfileId,
        plannerId: lead.plannerId,
      });

      if (dto.status === 'WON') {
        await this.leadRepository.update(id, {
          convertedAt: new Date(),
        });
        this.eventEmitter.emit('lead.converted', { leadId: id });
      }
    }

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
      const updated = await this.leadRepository.update(id, {
        status: 'CONTACTED',
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
