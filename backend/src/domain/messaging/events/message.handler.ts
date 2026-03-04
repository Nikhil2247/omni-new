// ============================================================================
// MESSAGE EVENT HANDLERS - Messaging Domain
// ============================================================================
// Handles in-app notifications for new messages in direct conversations
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { NotificationType } from '@prisma/client';
import type { Message } from '@prisma/client';

interface MessageCreatedPayload {
  message: Message & {
    sender?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      avatarUrl: string | null;
      vendorProfile?: {
        id: string;
        slug: string;
        businessName: string;
        profilePhotoUrl: string | null;
      } | null;
    };
  };
}

@Injectable()
export class MessagingEventHandler {
  private readonly logger = new Logger(MessagingEventHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('message.created')
  async handleMessageCreated(payload: MessageCreatedPayload) {
    const { message } = payload;

    if (!message.conversationId) {
      this.logger.warn('Message created without conversation ID');
      return;
    }

    this.logger.log(
      `New message in conversation: ${message.conversationId} from user: ${message.senderId}`,
    );

    try {
      // Get all participants in the conversation except the sender
      const participants = await this.prisma.conversationParticipant.findMany({
        where: {
          conversationId: message.conversationId,
          userId: { not: message.senderId },
        },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              vendorProfile: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (participants.length === 0) {
        this.logger.debug('No other participants to notify');
        return;
      }

      // Get sender info for notification message
      const senderName = message.sender
        ? [message.sender.firstName, message.sender.lastName]
            .filter(Boolean)
            .join(' ') ||
          message.sender.vendorProfile?.businessName ||
          'Someone'
        : 'Someone';

      // Create notification for each participant
      const notifications = participants.map((participant) => {
        // Determine the correct action URL based on whether the recipient is a vendor
        const isRecipientVendor = !!participant.user?.vendorProfile;
        const actionUrl = isRecipientVendor
          ? `/business-messages?conversation=${message.conversationId}`
          : `/messages?conversation=${message.conversationId}`;

        return this.notificationService.createNotification({
          userId: participant.userId,
          type: NotificationType.NEW_MESSAGE,
          title: 'New message',
          message: `${senderName} sent you a message.`,
          data: {
            conversationId: message.conversationId,
            messageId: message.id,
            senderId: message.senderId,
          },
          actionUrl,
        });
      });

      await Promise.all(notifications);

      this.logger.log(
        `Sent ${participants.length} notification(s) for message ${message.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notifications for message ${message.id}`,
        error,
      );
    }
  }
}
