// ============================================================================
// KYC EVENT LISTENERS - Operations Domain
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  KYC_EVENTS,
  KYCSubmittedEvent,
  KYCApprovedEvent,
  KYCRejectedEvent,
  KYCExpiredEvent,
  KYCDocumentUploadedEvent,
  KYCDocumentVerifiedEvent,
  KYCDocumentRejectedEvent,
} from './kyc.events';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class KYCEventListener {
  private readonly logger = new Logger(KYCEventListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  // ============================================================================
  // KYC LIFECYCLE EVENTS
  // ============================================================================

  @OnEvent(KYC_EVENTS.KYC_SUBMITTED)
  async handleKYCSubmitted(event: KYCSubmittedEvent) {
    this.logger.log(
      `KYC submitted: ${event.kycId} for vendor ${event.vendorProfileId}`,
    );

    // Ops notifications can be handled separately via admin/ops notification channel
  }

  @OnEvent(KYC_EVENTS.KYC_APPROVED)
  async handleKYCApproved(event: KYCApprovedEvent) {
    this.logger.log(
      `KYC approved: ${event.kycId} for vendor ${event.vendorProfileId}`,
    );

    await this.notificationService.createNotification({
      userId: event.vendorUserId,
      type: NotificationType.KYC_APPROVED,
      title: 'KYC approved',
      message:
        'Your KYC verification has been approved. You can now access vendor payouts.',
      data: { kycId: event.kycId, vendorProfileId: event.vendorProfileId },
      actionUrl: '/business/profile',
    });
  }

  @OnEvent(KYC_EVENTS.KYC_REJECTED)
  async handleKYCRejected(event: KYCRejectedEvent) {
    this.logger.log(
      `KYC rejected: ${event.kycId} for vendor ${event.vendorProfileId}`,
    );

    await this.notificationService.createNotification({
      userId: event.vendorUserId,
      type: NotificationType.KYC_REJECTED,
      title: 'KYC rejected',
      message: event.rejectionReason
        ? `Your KYC was rejected: ${event.rejectionReason}. Please re-submit documents.`
        : 'Your KYC was rejected. Please re-submit documents.',
      data: {
        kycId: event.kycId,
        vendorProfileId: event.vendorProfileId,
        rejectionReason: event.rejectionReason,
      },
      actionUrl: '/business/profile',
    });
  }

  @OnEvent(KYC_EVENTS.KYC_EXPIRED)
  async handleKYCExpired(event: KYCExpiredEvent) {
    this.logger.log(
      `KYC expired: ${event.kycId} for vendor ${event.vendorProfileId}`,
    );

    await this.notificationService.createNotification({
      userId: event.vendorUserId,
      type: NotificationType.KYC_REJECTED,
      title: 'KYC expired',
      message:
        'Your KYC verification expired. Please re-submit documents to continue payouts.',
      data: { kycId: event.kycId, vendorProfileId: event.vendorProfileId },
      actionUrl: '/business/profile',
    });
  }

  // ============================================================================
  // KYC DOCUMENT EVENTS
  // ============================================================================

  @OnEvent(KYC_EVENTS.KYC_DOCUMENT_UPLOADED)
  async handleKYCDocumentUploaded(event: KYCDocumentUploadedEvent) {
    this.logger.log(
      `KYC document uploaded: ${event.documentId} (${event.documentType})`,
    );

    // TODO: Implement actual handlers
    // - Notify ops team of new document
    // - Trigger automated document verification (if applicable)
  }

  @OnEvent(KYC_EVENTS.KYC_DOCUMENT_VERIFIED)
  async handleKYCDocumentVerified(event: KYCDocumentVerifiedEvent) {
    this.logger.log(
      `KYC document verified: ${event.documentId} (${event.documentType})`,
    );

    // TODO: Implement actual handlers
    // - Check if all required documents are now verified
    // - If so, auto-approve KYC or notify for final review
  }

  @OnEvent(KYC_EVENTS.KYC_DOCUMENT_REJECTED)
  async handleKYCDocumentRejected(event: KYCDocumentRejectedEvent) {
    this.logger.log(
      `KYC document rejected: ${event.documentId} (${event.documentType})`,
    );

    // TODO: Implement actual handlers
    // - Notify vendor of document rejection
    // - Request re-upload
  }
}
