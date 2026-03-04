// ============================================================================
// LEAD EVENT HANDLERS - Leads Domain
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { VendorBadgeService } from '../../catalog/services/vendor-badge.service';
import { NotificationType } from '@prisma/client';

interface LeadCreatedPayload {
  leadId: string;
  vendorProfileId: string;
  plannerId: string;
  source?: string;
}

interface LeadStatusChangedPayload {
  leadId: string;
  oldStatus: string;
  newStatus: string;
  vendorProfileId?: string;
  plannerId?: string;
}

interface MessageSentPayload {
  messageId: string;
  leadId: string;
  senderId: string;
}

@Injectable()
export class LeadEventHandler {
  private readonly logger = new Logger(LeadEventHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly badgeService: VendorBadgeService,
  ) {}

  @OnEvent('lead.created')
  async handleLeadCreated(payload: LeadCreatedPayload) {
    this.logger.log(`Lead created: ${payload.leadId}`);

    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: payload.vendorProfileId },
      select: { userId: true, businessName: true },
    });

    const planner = await this.prisma.user.findUnique({
      where: { id: payload.plannerId },
      select: { firstName: true, lastName: true },
    });

    const plannerName =
      [planner?.firstName, planner?.lastName].filter(Boolean).join(' ') ||
      'a planner';
    const vendorName = vendorProfile?.businessName || 'a vendor';

    const isGetQuoteLead = payload.source === 'INQUIRY';

    if (isGetQuoteLead) {
      const opsAdmins = await this.prisma.user.findMany({
        where: { userRoles: { some: { role: { name: 'OPERATIONAL_ADMIN' } } } },
        select: { id: true },
      });

      await Promise.all(
        opsAdmins.map((admin) =>
          this.notificationService.createNotification({
            userId: admin.id,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: 'New quote request',
            message: `${plannerName} requested a quote from ${vendorName}.`,
            data: { leadId: payload.leadId, plannerId: payload.plannerId },
            actionUrl: `/ops/leads/${payload.leadId}`,
          }),
        ),
      );

      await this.notificationService.createNotification({
        userId: payload.plannerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Quote request received',
        message: `Your request for ${vendorName} was received. Ops will follow up soon.`,
        data: { leadId: payload.leadId },
        actionUrl: `/inquiries/${payload.leadId}`,
      });

      return;
    }

    if (vendorProfile?.userId) {
      await this.notificationService.createNotification({
        userId: vendorProfile.userId,
        type: NotificationType.NEW_LEAD,
        title: 'New lead received',
        message: `${plannerName} sent a new inquiry.`,
        data: { leadId: payload.leadId, plannerId: payload.plannerId },
        actionUrl: `/business/leads/${payload.leadId}`,
      });
    }

    // Award badges for reaching lead milestones
    await this.badgeService.awardLeadBadges(payload.vendorProfileId);
  }

  @OnEvent('lead.status-changed')
  async handleLeadStatusChanged(payload: LeadStatusChangedPayload) {
    this.logger.log(
      `Lead ${payload.leadId} status changed: ${payload.oldStatus} → ${payload.newStatus}`,
    );

    let plannerId = payload.plannerId;
    if (!plannerId || !payload.vendorProfileId) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: payload.leadId },
        select: { plannerId: true, vendorProfileId: true },
      });
      plannerId = lead?.plannerId;
    }

    if (plannerId) {
      await this.notificationService.createNotification({
        userId: plannerId,
        type: NotificationType.LEAD_RESPONSE,
        title: 'Lead status updated',
        message: `Your inquiry status changed to ${payload.newStatus}.`,
        data: {
          leadId: payload.leadId,
          oldStatus: payload.oldStatus,
          newStatus: payload.newStatus,
        },
        actionUrl: `/inquiries/${payload.leadId}`,
      });
    }
  }

  @OnEvent('lead.converted')
  async handleLeadConverted(payload: { leadId: string }) {
    this.logger.log(`Lead converted: ${payload.leadId}`);

    // TODO: Trigger celebration notification
    // TODO: Update conversion metrics
    // TODO: Mark lead for ops team follow-up
  }

  @OnEvent('lead.contacted')
  async handleLeadContacted(payload: { leadId: string }) {
    this.logger.log(`Lead contacted: ${payload.leadId}`);

    // TODO: Send notification to planner
    // TODO: Update response time metrics
  }

  @OnEvent('message.sent')
  async handleMessageSent(payload: MessageSentPayload) {
    this.logger.log(`Message sent in lead: ${payload.leadId}`);

    const lead = await this.prisma.lead.findUnique({
      where: { id: payload.leadId },
      select: {
        plannerId: true,
        vendorProfile: { select: { userId: true } },
      },
    });

    const vendorUserId = lead?.vendorProfile?.userId;
    const recipientId =
      payload.senderId === vendorUserId ? lead?.plannerId : vendorUserId;

    if (recipientId) {
      await this.notificationService.createNotification({
        userId: recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: 'New message',
        message: 'You have a new message on an inquiry.',
        data: { leadId: payload.leadId, messageId: payload.messageId },
        actionUrl:
          payload.senderId === vendorUserId
            ? `/inquiries/${payload.leadId}`
            : `/business/leads/${payload.leadId}`,
      });
    }
  }

  @OnEvent('messages.read')
  async handleMessagesRead(payload: { messageIds: string[]; userId: string }) {
    this.logger.log(`Messages read by user: ${payload.userId}`);

    // TODO: Send read receipts via websocket
  }
}
