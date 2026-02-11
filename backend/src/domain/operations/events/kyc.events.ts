// ============================================================================
// KYC EVENTS - Operations Domain
// ============================================================================

export const KYC_EVENTS = {
  KYC_SUBMITTED: 'kyc.submitted',
  KYC_APPROVED: 'kyc.approved',
  KYC_REJECTED: 'kyc.rejected',
  KYC_EXPIRED: 'kyc.expired',
  KYC_DOCUMENT_UPLOADED: 'kyc.document.uploaded',
  KYC_DOCUMENT_VERIFIED: 'kyc.document.verified',
  KYC_DOCUMENT_REJECTED: 'kyc.document.rejected',
} as const

// ============================================================================
// EVENT PAYLOADS
// ============================================================================

export interface KYCSubmittedEvent {
  kycId: string
  vendorProfileId: string
  vendorUserId: string
  legalName: string
  businessType: string
  submittedAt: Date
}

export interface KYCApprovedEvent {
  kycId: string
  vendorProfileId: string
  vendorUserId: string
  legalName: string
  approvedAt: Date
  approvedBy?: string
}

export interface KYCRejectedEvent {
  kycId: string
  vendorProfileId: string
  vendorUserId: string
  legalName: string
  rejectedAt: Date
  rejectedBy?: string
  rejectionReason: string
}

export interface KYCExpiredEvent {
  kycId: string
  vendorProfileId: string
  vendorUserId: string
  expiredAt: Date
}

export interface KYCDocumentUploadedEvent {
  documentId: string
  kycId: string
  vendorProfileId: string
  documentType: string
  uploadedAt: Date
}

export interface KYCDocumentVerifiedEvent {
  documentId: string
  kycId: string
  vendorProfileId: string
  documentType: string
  verifiedAt: Date
  verifiedBy?: string
}

export interface KYCDocumentRejectedEvent {
  documentId: string
  kycId: string
  vendorProfileId: string
  documentType: string
  rejectedAt: Date
  rejectedBy?: string
  rejectionReason?: string
}
