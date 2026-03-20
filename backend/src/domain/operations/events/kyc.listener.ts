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
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationType, DocumentStatus, DocumentType } from '@prisma/client';

@Injectable()
export class KYCEventListener {
  private readonly logger = new Logger(KYCEventListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

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

    // Set VendorProfile.verifiedAt when KYC is approved
    await this.prisma.vendorProfile.update({
      where: { id: event.vendorProfileId },
      data: {
        verifiedAt: new Date(),
        status: 'ACTIVE', // Auto-activate vendor when KYC approved
      },
    });

    this.logger.log(
      `Vendor ${event.vendorProfileId} verified and activated after KYC approval`,
    );

    // Get vendor user ID for notification
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: event.vendorProfileId },
      select: { userId: true },
    });

    if (vendorProfile?.userId) {
      await this.notificationService.createNotification({
        userId: vendorProfile.userId,
        type: NotificationType.KYC_APPROVED,
        title: 'KYC Approved - You are now Verified!',
        message:
          'Congratulations! Your KYC verification has been approved. Your profile is now verified and active.',
        data: { kycId: event.kycId, vendorProfileId: event.vendorProfileId },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(KYC_EVENTS.KYC_REJECTED)
  async handleKYCRejected(event: KYCRejectedEvent) {
    this.logger.log(
      `KYC rejected: ${event.kycId} for vendor ${event.vendorProfileId}`,
    );

    // Get vendor user ID for notification
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: event.vendorProfileId },
      select: { userId: true },
    });

    if (vendorProfile?.userId) {
      await this.notificationService.createNotification({
        userId: vendorProfile.userId,
        type: NotificationType.KYC_REJECTED,
        title: 'KYC Verification Rejected',
        message: event.rejectionReason
          ? `Your KYC was rejected: ${event.rejectionReason}. Please review and re-submit your documents.`
          : 'Your KYC was rejected. Please review and re-submit your documents.',
        data: {
          kycId: event.kycId,
          vendorProfileId: event.vendorProfileId,
          rejectionReason: event.rejectionReason,
        },
        actionUrl: '/business/verification',
      });
    }
  }

  @OnEvent(KYC_EVENTS.KYC_EXPIRED)
  async handleKYCExpired(event: KYCExpiredEvent) {
    this.logger.log(
      `KYC expired: ${event.kycId} for vendor ${event.vendorProfileId}`,
    );

    // Remove verified status when KYC expires
    await this.prisma.vendorProfile.update({
      where: { id: event.vendorProfileId },
      data: {
        verifiedAt: null, // Remove verified status
      },
    });

    // Get vendor user ID for notification
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: event.vendorProfileId },
      select: { userId: true },
    });

    if (vendorProfile?.userId) {
      await this.notificationService.createNotification({
        userId: vendorProfile.userId,
        type: NotificationType.KYC_REJECTED,
        title: 'KYC Verification Expired',
        message:
          'Your KYC verification has expired. Please re-submit your documents to maintain your verified status.',
        data: { kycId: event.kycId, vendorProfileId: event.vendorProfileId },
        actionUrl: '/business/verification',
      });
    }
  }

  // ============================================================================
  // KYC DOCUMENT EVENTS
  // ============================================================================

  @OnEvent(KYC_EVENTS.KYC_DOCUMENT_UPLOADED)
  async handleKYCDocumentUploaded(event: KYCDocumentUploadedEvent) {
    this.logger.log(
      `KYC document uploaded: ${event.documentId} (${event.documentType})`,
    );

    // Check if all required documents are uploaded
    const kyc = await this.prisma.vendorKYC.findUnique({
      where: { id: event.kycId },
      include: { documents: true, vendorProfile: { select: { userId: true } } },
    });

    if (!kyc) return;

    // Auto-submit KYC if minimum required documents are uploaded
    const uploadedTypes = new Set(kyc.documents.map((d) => d.type));
    const requiredTypes: DocumentType[] = [
      DocumentType.BUSINESS_LICENSE,
      DocumentType.ID_DOCUMENT,
    ];
    const hasMinRequired = requiredTypes.every((type) =>
      uploadedTypes.has(type),
    );

    if (hasMinRequired && kyc.status === 'PENDING') {
      // Auto-submit for review
      await this.prisma.vendorKYC.update({
        where: { id: event.kycId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      this.logger.log(
        `KYC ${event.kycId} auto-submitted after required documents uploaded`,
      );
    }
  }

  @OnEvent(KYC_EVENTS.KYC_DOCUMENT_VERIFIED)
  async handleKYCDocumentVerified(event: KYCDocumentVerifiedEvent) {
    this.logger.log(
      `KYC document verified: ${event.documentId} (${event.documentType})`,
    );

    // Check if all documents are now verified
    const kyc = await this.prisma.vendorKYC.findUnique({
      where: { id: event.kycId },
      include: { documents: true },
    });

    if (!kyc) return;

    const allVerified = kyc.documents.every(
      (doc) => doc.status === DocumentStatus.VERIFIED,
    );
    const hasDocuments = kyc.documents.length > 0;

    if (allVerified && hasDocuments && kyc.status === 'UNDER_REVIEW') {
      // All documents verified - flag for final approval
      this.logger.log(
        `All documents verified for KYC ${event.kycId} - ready for final approval`,
      );

      // Optionally auto-approve if all required documents verified
      // For now, just log - ops team should do final approval
    }
  }

  @OnEvent(KYC_EVENTS.KYC_DOCUMENT_REJECTED)
  async handleKYCDocumentRejected(event: KYCDocumentRejectedEvent) {
    this.logger.log(
      `KYC document rejected: ${event.documentId} (${event.documentType})`,
    );

    // Get KYC and vendor info
    const kyc = await this.prisma.vendorKYC.findUnique({
      where: { id: event.kycId },
      include: { vendorProfile: { select: { userId: true } } },
    });

    if (!kyc) return;

    // Notify vendor of document rejection (only if vendor has an associated user)
    if (kyc.vendorProfile.userId) {
      await this.notificationService.createNotification({
        userId: kyc.vendorProfile.userId,
        type: NotificationType.KYC_REJECTED,
        title: 'Document Rejected',
        message: event.rejectionReason
          ? `Your ${event.documentType.replace('_', ' ').toLowerCase()} was rejected: ${event.rejectionReason}. Please upload a new document.`
          : `Your ${event.documentType.replace('_', ' ').toLowerCase()} was rejected. Please upload a new document.`,
        data: {
          kycId: event.kycId,
          documentId: event.documentId,
          documentType: event.documentType,
          rejectionReason: event.rejectionReason,
        },
        actionUrl: '/business/verification',
      });
    }

    // If KYC was under review, move back to submitted for re-upload
    if (kyc.status === 'UNDER_REVIEW') {
      await this.prisma.vendorKYC.update({
        where: { id: event.kycId },
        data: { status: 'SUBMITTED' },
      });
    }
  }
}
