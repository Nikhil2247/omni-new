// ============================================================================
// CONVERSATION SERVICE - Messaging Domain
// ============================================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Conversation, ParticipantRole } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationRepository: ConversationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createDirectConversationForVendor(
    userId: string,
    vendorProfileId: string,
  ): Promise<Conversation> {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: { userId: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (!vendor.userId) {
      throw new BadRequestException('Vendor has no associated user (unclaimed vendor)');
    }

    return this.createDirectConversation(userId, vendor.userId);
  }

  async createDirectConversation(
    userId: string,
    participantUserId: string,
  ): Promise<Conversation> {
    if (userId === participantUserId) {
      throw new BadRequestException(
        'Cannot create a conversation with yourself',
      );
    }

    const vendorProfiles = await this.prisma.vendorProfile.findMany({
      where: { userId: { in: [userId, participantUserId] } },
      select: { userId: true },
    });
    const vendorUserIds = new Set(vendorProfiles.map(v => v.userId));
    const userRole = vendorUserIds.has(userId) ? 'VENDOR' : 'PLANNER';
    const participantRole = vendorUserIds.has(participantUserId) ? 'VENDOR' : 'PLANNER';

    const existing = await this.conversationRepository.findConversationByUsers(
      userId,
      participantUserId,
    );

    if (existing) {
      return existing;
    }

    const conversation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { userId, role: userRole },
              { userId: participantUserId, role: participantRole },
            ],
          },
        },
      });

      return created;
    });

    this.eventEmitter.emit('conversation.created', {
      conversation,
      participants: [userId, participantUserId],
    });

    return conversation;
  }

  async createLeadConversation(
    leadId: string,
    plannerId: string,
    vendorProfileId: string,
  ): Promise<Conversation> {
    // Check if a conversation already exists for this lead
    const existingByLead =
      await this.conversationRepository.findByLeadId(leadId);
    if (existingByLead) {
      return existingByLead;
    }

    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: { userId: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (!vendor.userId) {
      throw new BadRequestException('Vendor has no associated user (unclaimed vendor)');
    }

    const vendorUserId = vendor.userId; // Capture non-null value for use in transaction

    // Check if there's an existing direct conversation between these users
    // If so, link it to the lead instead of creating a new one
    const existingDirect =
      await this.conversationRepository.findDirectConversationByUsers(
        plannerId,
        vendorUserId,
      );

    if (existingDirect) {
      // Update the existing conversation to link to this lead
      const updated = await this.prisma.conversation.update({
        where: { id: existingDirect.id },
        data: { leadId },
      });
      return updated;
    }

    // No existing conversation, create a new one
    const conversation = await this.prisma.$transaction(async (tx) => {
      return tx.conversation.create({
        data: {
          type: 'LEAD',
          leadId,
          participants: {
            create: [
              { userId: plannerId, role: 'PLANNER' },
              { userId: vendorUserId, role: 'VENDOR' },
            ],
          },
        },
      });
    });

    this.eventEmitter.emit('conversation.created', {
      conversation,
      participants: [plannerId, vendorUserId],
    });

    return conversation;
  }

  async getUserConversations(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Conversation>> {
    return this.conversationRepository.findUserConversations(
      userId,
      page,
      limit,
    );
  }

  async getUserConversationIds(userId: string): Promise<string[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      select: { id: true },
    });

    return conversations.map((conversation) => conversation.id);
  }

  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    await this.ensureParticipant(conversationId, userId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                vendorProfile: {
                  select: {
                    id: true,
                    businessName: true,
                    profilePhotoUrl: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            attachments: true,
            reactions: true,
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async ensureParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found or access denied');
    }
  }

  async updateLastMessageAt(
    conversationId: string,
    timestamp: Date,
  ): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: timestamp },
    });
  }

}
