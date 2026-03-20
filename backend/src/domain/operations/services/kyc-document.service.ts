// ============================================================================
// KYC DOCUMENT SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { KYCDocument, DocumentType, DocumentStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { MinioService } from '../../../infrastructure/storage/minio.service';
import { StoragePathHelper } from '../../../infrastructure/storage/storage-path.helper';
import { KYC_EVENTS } from '../events/kyc.events';

@Injectable()
export class KycDocumentService {
  private readonly logger = new Logger(KycDocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storagePathHelper: StoragePathHelper,
  ) {}

  /**
   * Get vendor slug from KYC ID
   */
  private async getVendorSlugForKyc(kycId: string): Promise<string> {
    const kyc = await this.prisma.vendorKYC.findUnique({
      where: { id: kycId },
      include: {
        vendorProfile: {
          select: { slug: true },
        },
      },
    });
    return kyc?.vendorProfile?.slug || 'unknown';
  }

  /**
   * Upload a KYC document
   */
  async upload(
    kycId: string,
    type: DocumentType,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    notes?: string,
  ): Promise<KYCDocument> {
    this.logger.log(`Uploading KYC document: ${type} for KYC ${kycId}`);

    // Verify KYC exists and get vendor slug
    const kyc = await this.prisma.vendorKYC.findUnique({
      where: { id: kycId },
      include: {
        vendorProfile: {
          select: { slug: true },
        },
      },
    });

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    // Check if document of this type already exists
    const existingDoc = await this.prisma.kYCDocument.findFirst({
      where: { kycId, type },
    });

    // Get vendor slug for path generation
    const vendorSlug = kyc.vendorProfile?.slug || 'unknown';

    // Generate path using StoragePathHelper: vendors/{vendorSlug}/kyc/{documentType}_{timestamp}_{filename}
    const objectName = this.storagePathHelper.vendorKycDocument(
      { vendorSlug },
      type,
      originalName,
    );

    // Upload file to storage (uses default bucket)
    await this.minioService.uploadFile(
      objectName,
      fileBuffer,
      fileBuffer.length,
      { contentType: mimeType },
    );
    const url = await this.minioService.getFileUrl(objectName);

    let document: KYCDocument;

    if (existingDoc) {
      // Update existing document
      // Delete old file from storage
      try {
        // Extract object name from URL for deletion
        const oldObjectName = this.extractObjectNameFromUrl(existingDoc.url);
        if (oldObjectName) {
          await this.minioService.deleteFile(oldObjectName);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete old document: ${existingDoc.url}`);
      }

      document = await this.prisma.kYCDocument.update({
        where: { id: existingDoc.id },
        data: {
          url,
          fileName: originalName,
          fileSize: fileBuffer.length,
          mimeType,
          status: DocumentStatus.PENDING,
          notes,
          reviewerId: null,
          reviewedAt: null,
        },
      });
    } else {
      // Create new document
      document = await this.prisma.kYCDocument.create({
        data: {
          kycId,
          type,
          url,
          fileName: originalName,
          fileSize: fileBuffer.length,
          mimeType,
          status: DocumentStatus.PENDING,
          notes,
        },
      });
    }

    // Emit document uploaded event
    this.eventEmitter.emit(KYC_EVENTS.KYC_DOCUMENT_UPLOADED, {
      documentId: document.id,
      kycId,
      vendorProfileId: kyc.vendorProfileId,
      documentType: type,
      uploadedAt: new Date(),
    });

    return document;
  }

  /**
   * Find all documents for a KYC record
   */
  async findByKycId(kycId: string): Promise<KYCDocument[]> {
    return this.prisma.kYCDocument.findMany({
      where: { kycId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a document by ID
   */
  async findById(id: string): Promise<KYCDocument> {
    const document = await this.prisma.kYCDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * Delete a document
   */
  async delete(documentId: string, kycId: string): Promise<void> {
    const document = await this.prisma.kYCDocument.findFirst({
      where: { id: documentId, kycId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from storage
    try {
      const objectName = this.extractObjectNameFromUrl(document.url);
      if (objectName) {
        await this.minioService.deleteFile(objectName);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete document from storage: ${document.url}`);
    }

    // Delete from database
    await this.prisma.kYCDocument.delete({
      where: { id: documentId },
    });
  }

  /**
   * Verify a document (ops action)
   */
  async verify(
    documentId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<KYCDocument> {
    const document = await this.findById(documentId);

    const updated = await this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.VERIFIED,
        reviewerId,
        reviewedAt: new Date(),
        notes: notes || document.notes,
      },
    });

    // Get KYC for event
    const kyc = await this.prisma.vendorKYC.findUnique({
      where: { id: document.kycId },
    });

    // Emit document verified event
    this.eventEmitter.emit(KYC_EVENTS.KYC_DOCUMENT_VERIFIED, {
      documentId,
      kycId: document.kycId,
      vendorProfileId: kyc?.vendorProfileId,
      documentType: document.type,
      verifiedAt: new Date(),
      verifiedBy: reviewerId,
    });

    return updated;
  }

  /**
   * Reject a document (ops action)
   */
  async reject(
    documentId: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<KYCDocument> {
    const document = await this.findById(documentId);

    const updated = await this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.REJECTED,
        reviewerId,
        reviewedAt: new Date(),
        notes: rejectionReason,
      },
    });

    // Get KYC for event
    const kyc = await this.prisma.vendorKYC.findUnique({
      where: { id: document.kycId },
    });

    // Emit document rejected event
    this.eventEmitter.emit(KYC_EVENTS.KYC_DOCUMENT_REJECTED, {
      documentId,
      kycId: document.kycId,
      vendorProfileId: kyc?.vendorProfileId,
      documentType: document.type,
      rejectedAt: new Date(),
      rejectedBy: reviewerId,
      rejectionReason,
    });

    return updated;
  }

  /**
   * Extract object name from MinIO URL
   * URL format: http(s)://host:port/bucket/object-name
   */
  private extractObjectNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Path is /bucket/object-name, we need object-name (everything after bucket)
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        // Skip bucket name (first part), join the rest
        return pathParts.slice(1).join('/');
      }
      return null;
    } catch {
      // If URL parsing fails, try to extract kyc path directly
      const kycMatch = url.match(/kyc\/[^?]+/);
      return kycMatch ? kycMatch[0] : null;
    }
  }
}
