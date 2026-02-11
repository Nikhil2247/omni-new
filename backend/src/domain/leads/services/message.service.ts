// ============================================================================
// MESSAGE SERVICE - Leads Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Message } from '@prisma/client'
import { MessageRepository } from '../repositories/message.repository'
import { CreateMessageDto, GetMessagesDto } from '../dto/message.dto'
import { PaginatedResult } from '../../../core/database/repositories/base.repository'
import { LeadRepository } from '../repositories/lead.repository'
import { ConversationService } from '../../messaging/services/conversation.service'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly leadRepository: LeadRepository,
    private readonly conversationService: ConversationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateMessageDto): Promise<Message> {
    this.logger.log(`Creating message for lead: ${dto.leadId} from sender: ${dto.senderId}`)

    const lead = await this.leadRepository.findById(dto.leadId)
    if (!lead) {
      throw new NotFoundException('Lead not found')
    }

    const conversation = await this.conversationService.createLeadConversation(
      lead.id,
      lead.plannerId,
      lead.vendorProfileId,
    )

    const message = await this.messageRepository.create({
      lead: { connect: { id: dto.leadId } },
      conversation: { connect: { id: conversation.id } },
      sender: { connect: { id: dto.senderId } },
      content: dto.content,
    })

    this.eventEmitter.emit('message.sent', {
      messageId: message.id,
      leadId: dto.leadId,
      senderId: dto.senderId,
    })

    return message
  }

  async findById(id: string): Promise<Message> {
    const message = await this.messageRepository.findById(id)
    if (!message) {
      throw new NotFoundException('Message not found')
    }
    return message
  }

  async findByLeadId(leadId: string, dto: GetMessagesDto): Promise<PaginatedResult<Message>> {
    const { page = 1, limit = 50 } = dto
    return this.messageRepository.findByLeadId(leadId, page, limit)
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    await this.messageRepository.markAsRead(messageIds)
    this.eventEmitter.emit('messages.read', { messageIds, userId })
  }

  async getUnreadCount(leadId: string, userId: string): Promise<number> {
    return this.messageRepository.getUnreadCount(leadId, userId)
  }

  async getLatestMessage(leadId: string): Promise<Message | null> {
    return this.messageRepository.getLatestMessage(leadId)
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.messageRepository.delete(id)
    this.eventEmitter.emit('message.deleted', { messageId: id })
  }
}
