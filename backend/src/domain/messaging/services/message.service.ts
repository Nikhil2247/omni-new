// ============================================================================
// MESSAGE SERVICE - Messaging Domain
// ============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Message } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma.service'
import { ConversationService } from './conversation.service'
import { MessagingMessageRepository } from '../repositories/message.repository'
import { PaginatedResult } from '../../../core/database/repositories/base.repository'
import { SendMessageDto } from '../dto/message.dto'

@Injectable()
export class MessagingMessageService {
  private readonly logger = new Logger(MessagingMessageService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly messageRepository: MessagingMessageRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    if (!dto.conversationId) {
      throw new NotFoundException('Conversation ID is required')
    }

    await this.conversationService.ensureParticipant(dto.conversationId, senderId)

    const createdAt = new Date()

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversation: { connect: { id: dto.conversationId } },
          sender: { connect: { id: senderId } },
          content: dto.content,
          attachments: dto.attachments?.length
            ? {
                create: dto.attachments.map((attachment) => ({
                  type: attachment.type as any,
                  url: attachment.url,
                  fileName: attachment.fileName,
                  fileSize: attachment.fileSize,
                  mimeType: attachment.mimeType,
                })),
              }
            : undefined,
        },
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
              vendorProfile: {
                select: {
                  id: true,
                  slug: true,
                  businessName: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
        },
      })

      await tx.conversation.update({
        where: { id: dto.conversationId },
        data: { lastMessageAt: createdAt },
      })

      return created
    })

    this.eventEmitter.emit('message.created', { message })

    return message
  }

  async getMessages(userId: string, conversationId: string, page = 1, limit = 50): Promise<PaginatedResult<Message>> {
    await this.conversationService.ensureParticipant(conversationId, userId)
    return this.messageRepository.findByConversationId(conversationId, page, limit)
  }

  async markRead(userId: string, messageId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    })

    if (!message || !message.conversationId) {
      throw new NotFoundException('Message not found')
    }

    await this.conversationService.ensureParticipant(message.conversationId, userId)

    const readAt = new Date()

    await this.prisma.$transaction(async (tx) => {
      await tx.messageReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
        update: { readAt },
        create: { messageId, userId, readAt },
      })

      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: message.conversationId as string,
            userId,
          },
        },
        data: { lastReadAt: readAt },
      })
    })

    this.eventEmitter.emit('message.read', {
      messageId,
      conversationId: message.conversationId,
      userId,
      readAt,
    })
  }

  async addReaction(userId: string, messageId: string, emoji: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    })

    if (!message || !message.conversationId) {
      throw new NotFoundException('Message not found')
    }

    await this.conversationService.ensureParticipant(message.conversationId, userId)

    await this.prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      update: {},
      create: {
        messageId,
        userId,
        emoji,
      },
    })

    this.eventEmitter.emit('message.reaction', {
      messageId,
      conversationId: message.conversationId,
      userId,
      emoji,
    })
  }

  async deleteForUser(userId: string, messageId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    })

    if (!message || !message.conversationId) {
      throw new NotFoundException('Message not found')
    }

    await this.conversationService.ensureParticipant(message.conversationId, userId)

    await this.prisma.messageDeletion.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: {},
      create: {
        messageId,
        userId,
      },
    })

    this.eventEmitter.emit('message.deleted', {
      messageId,
      conversationId: message.conversationId,
      userId,
    })
  }
}
