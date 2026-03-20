// ============================================================================
// WHATSAPP SERVICE - Planning Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WhatsAppRepository } from '../repositories/whatsapp.repository';
import {
  SendWhatsAppInviteDto,
  SendWhatsAppBulkDto,
} from '../dto/whatsapp.dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly whatsappRepository: WhatsAppRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all message templates
   */
  async getTemplates() {
    return this.whatsappRepository.findAllTemplates();
  }

  /**
   * Send WhatsApp invites to specific guests
   */
  async sendInvites(dto: SendWhatsAppInviteDto) {
    // Validate guests exist and have phone numbers
    const guests = await this.whatsappRepository.findGuestsByIds(dto.guestIds);

    if (guests.length === 0) {
      throw new NotFoundException('No guests found with the provided IDs');
    }

    const guestsWithPhone = guests.filter((g) => g.phone);
    const guestsWithoutPhone = guests.filter((g) => !g.phone);

    if (guestsWithPhone.length === 0) {
      throw new BadRequestException(
        'None of the selected guests have phone numbers',
      );
    }

    // Get guestlist ID from first guest
    const guestlistId = guestsWithPhone[0].guestlistId;

    // Create message records
    const messageData = guestsWithPhone.map((guest) => ({
      guestId: guest.id,
      guestlistId,
      messageType: 'INVITE' as const,
      templateId: dto.templateId,
      customMessage: dto.customMessage,
    }));

    const count = await this.whatsappRepository.createManyMessages(messageData);

    this.logger.log(
      `Created ${count} WhatsApp messages for guestlist ${guestlistId}`,
    );

    // Emit event to trigger actual sending (can be processed by a job)
    this.eventEmitter.emit('whatsapp.messages-queued', {
      guestlistId,
      count,
    });

    return {
      success: true,
      sent: count,
      failed: guestsWithoutPhone.length,
      errors: guestsWithoutPhone.map((g) => ({
        guestId: g.id,
        error: 'No phone number',
      })),
      guestlistId, // Include guestlistId for usage tracking
    };
  }

  /**
   * Send bulk WhatsApp invites to all guests matching filter
   */
  async sendBulkInvites(dto: SendWhatsAppBulkDto) {
    // Get guests matching filter
    const guests = await this.whatsappRepository.findGuestsWithPhone(
      dto.guestlistId,
      dto.filter,
    );

    if (guests.length === 0) {
      return {
        success: true,
        sent: 0,
        failed: 0,
        errors: [],
        guestlistId: dto.guestlistId,
      };
    }

    // Create message records
    const messageData = guests.map((guest) => ({
      guestId: guest.id,
      guestlistId: dto.guestlistId,
      messageType: 'INVITE' as const,
      templateId: dto.templateId,
      customMessage: dto.customMessage,
    }));

    const count = await this.whatsappRepository.createManyMessages(messageData);

    this.logger.log(
      `Created ${count} bulk WhatsApp messages for guestlist ${dto.guestlistId}`,
    );

    // Emit event to trigger actual sending
    this.eventEmitter.emit('whatsapp.messages-queued', {
      guestlistId: dto.guestlistId,
      count,
    });

    return {
      success: true,
      sent: count,
      failed: 0,
      errors: [],
      guestlistId: dto.guestlistId, // Include guestlistId for usage tracking
    };
  }

  /**
   * Get message history for a guestlist
   */
  async getHistory(guestlistId: string) {
    const messages =
      await this.whatsappRepository.findMessagesByGuestlistId(guestlistId);

    return messages.map((msg) => ({
      id: msg.id,
      guestId: msg.guestId,
      guestName: `${msg.guest.firstName} ${msg.guest.lastName || ''}`.trim(),
      guestPhone: msg.guest.phone || '',
      messageType: msg.messageType,
      status: msg.status,
      sentAt: msg.sentAt,
      deliveredAt: msg.deliveredAt,
      readAt: msg.readAt,
      errorMessage: msg.errorMessage,
    }));
  }

  /**
   * Get message summary stats for a guestlist
   */
  async getSummary(guestlistId: string) {
    return this.whatsappRepository.getMessageStats(guestlistId);
  }

  /**
   * Process pending messages (called by job processor)
   * This is a placeholder - actual implementation would integrate with WhatsApp Business API
   */
  async processPendingMessages() {
    const messages = await this.whatsappRepository.findPendingMessages(50);

    for (const message of messages) {
      try {
        // TODO: Integrate with WhatsApp Business API (e.g., Twilio, MessageBird, Meta)
        // For now, just mark as sent
        await this.whatsappRepository.updateMessage(message.id, {
          status: 'SENT',
          sentAt: new Date(),
        });

        this.logger.debug(`Processed WhatsApp message ${message.id}`);
      } catch (error) {
        await this.whatsappRepository.updateMessage(message.id, {
          status: 'FAILED',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });

        this.logger.error(
          `Failed to send WhatsApp message ${message.id}`,
          error,
        );
      }
    }

    return { processed: messages.length };
  }

  /**
   * Update message status (webhook callback from WhatsApp provider)
   */
  async updateMessageStatus(
    externalId: string,
    status: 'DELIVERED' | 'READ' | 'FAILED',
    errorMessage?: string,
  ) {
    // This would be called by webhook handlers
    // For now, this is a placeholder for the webhook integration
    this.logger.log(
      `Received status update for message ${externalId}: ${status}`,
    );
  }
}
