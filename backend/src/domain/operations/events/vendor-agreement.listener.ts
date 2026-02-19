// ============================================================================
// Vendor Agreement Events - Event Listeners
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class VendorAgreementListener {
  private readonly logger = new Logger(VendorAgreementListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('vendor-agreement.created')
  async handleAgreementCreated(payload: {
    agreementId: string;
    activeEventId?: string;
  }) {
    this.logger.log(`Vendor agreement created: ${payload.agreementId}`);

    const agreement = await this.prisma.vendorAgreement.findUnique({
      where: { id: payload.agreementId },
      select: {
        vendorProfileId: true,
        vendorName: true,
        activeEvent: { select: { opsAdminId: true, opsManagerId: true } },
      },
    });

    if (!agreement?.vendorProfileId) return;

    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: agreement.vendorProfileId },
      select: { userId: true },
    });

    if (vendorProfile?.userId) {
      await this.notificationService.createNotification({
        userId: vendorProfile.userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'New vendor agreement',
        message: `A new agreement was created for ${agreement.vendorName}.`,
        data: { agreementId: payload.agreementId },
        actionUrl: `/business/agreements/${payload.agreementId}`,
      });
    }

    const opsRecipients = [
      agreement.activeEvent?.opsAdminId,
      agreement.activeEvent?.opsManagerId,
    ].filter((id): id is string => Boolean(id));

    await Promise.all(
      Array.from(new Set(opsRecipients)).map((userId) =>
        this.notificationService.createNotification({
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Vendor agreement created',
          message: `Agreement created for ${agreement.vendorName}.`,
          data: { agreementId: payload.agreementId },
          actionUrl: `/ops/vendor-agreements`,
        }),
      ),
    );
  }

  @OnEvent('vendor-agreement.updated')
  async handleAgreementUpdated(payload: { agreementId: string }) {
    this.logger.log(`Vendor agreement updated: ${payload.agreementId}`);

    const agreement = await this.prisma.vendorAgreement.findUnique({
      where: { id: payload.agreementId },
      select: {
        vendorProfileId: true,
        vendorName: true,
        status: true,
        activeEvent: { select: { opsAdminId: true, opsManagerId: true } },
      },
    });

    if (!agreement?.vendorProfileId) return;

    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: agreement.vendorProfileId },
      select: { userId: true },
    });

    if (vendorProfile?.userId) {
      await this.notificationService.createNotification({
        userId: vendorProfile.userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Vendor agreement updated',
        message: `Agreement status is now ${agreement.status}.`,
        data: { agreementId: payload.agreementId, status: agreement.status },
        actionUrl: `/business/agreements/${payload.agreementId}`,
      });
    }

    const opsRecipients = [
      agreement.activeEvent?.opsAdminId,
      agreement.activeEvent?.opsManagerId,
    ].filter((id): id is string => Boolean(id));

    await Promise.all(
      Array.from(new Set(opsRecipients)).map((userId) =>
        this.notificationService.createNotification({
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Vendor agreement updated',
          message: `Agreement status is now ${agreement.status}.`,
          data: { agreementId: payload.agreementId, status: agreement.status },
          actionUrl: `/ops/vendor-agreements`,
        }),
      ),
    );
  }
}
