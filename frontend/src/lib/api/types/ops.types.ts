export interface OpsDashboardMetrics {
  activeEvents: {
    total: number
    byStatus: Record<string, number>
  }
  kyc: {
    pending: number
    underReview: number
    approved: number
    rejected: number
  }
  disputes: {
    open: number
    investigating: number
    resolved: number
  }
  billing: {
    pendingPayouts: number
    totalPendingAmount: number
  }
  tasks: {
    totalAssigned: number
    completed: number
    overdue: number
  }
}

export interface OpsActiveEvent {
  id: string
  origin: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  eventType: string
  eventDate?: string | null
  eventEndDate?: string | null
  venueName?: string | null
  status: string
  totalBudget?: number | string | null
  totalSpend?: number | string | null
  opsAdminId?: string | null
  opsManagerId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface OpsOperationalTask {
  id: string
  title: string
  description?: string | null
  category?: string | null
  status: string
  priority: string
  dueDate?: string | null
  startedAt?: string | null
  completedAt?: string | null
  proofSubmittedAt?: string | null
  proofUrl?: string | null
  proofNotes?: string | null
  reviewNotes?: string | null
  activeEventId: string
  assignedToUserId?: string | null
  assignedToVendorId?: string | null
  assignedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  activeEvent?: {
    id: string
    clientName?: string | null
    eventType?: string | null
    eventDate?: string | null
  }
}

export interface OpsDispute {
  id: string
  status: string
  type?: string | null
  title?: string | null
  description?: string | null
  createdAt?: string | null
  resolvedAt?: string | null
  resolution?: string | null
}

export interface OpsKycDocument {
  id: string
  kycId: string
  type: 'BUSINESS_LICENSE' | 'ID_DOCUMENT' | 'TAX_CERTIFICATE' | 'INSURANCE' | 'ADDRESS_PROOF' | 'OTHER'
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  notes?: string | null
  reviewerId?: string | null
  reviewedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface OpsKycRecord {
  id: string
  vendorProfileId: string
  status: string
  businessName?: string | null
  businessType?: string | null
  registrationNumber?: string | null
  taxId?: string | null
  businessAddress?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  reviewerId?: string | null
  rejectionReason?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  documents?: OpsKycDocument[]
  vendorProfile?: {
    id: string
    businessName?: string | null
    slug?: string | null
    status?: string | null
  }
}

export interface OpsRequirementSheet {
  id: string
  activeEventId: string
  notes?: string | null
  approvalToken?: string | null
  approvalStatus?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  sentToClientAt?: string | null
  clientApprovedAt?: string | null
  clientRejectedAt?: string | null
  rejectionReason?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  items?: Array<{
    id: string
    category: string
    description: string
    quantity: number
    status: string
    priority?: string
    estimatedBudget?: string | number | null
  }>
}

export interface OpsVendorAgreement {
  id: string
  activeEventId: string
  vendorProfileId: string
  requirementItemId?: string | null
  vendorName: string
  status?: string | null
  agreedAmount?: number | null
  advancePaid?: number | null
  balanceDue?: number | null
  contractUrl?: string | null
  sentAt?: string | null
  acceptedAt?: string | null
  declinedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  vendorProfile?: {
    id: string
    businessName?: string | null
  }
}

export interface OpsInvoice {
  id: string
  vendorAgreementId: string
  invoiceNumber: string
  amount: number | string
  status: string
  issuedAt?: string | null
  paidAt?: string | null
  vendorAgreement?: {
    id: string
    vendorName?: string | null
    agreedAmount?: number | null
    activeEvent?: {
      id: string
      clientName?: string | null
      eventType?: string | null
      eventDate?: string | null
    }
    vendorProfile?: {
      id: string
      businessName?: string | null
    }
  }
}

export interface OpsInvoicesListResponse {
  items: OpsInvoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OpsVendorProfile {
  id: string
  businessName?: string | null
  slug?: string | null
  description?: string | null
  tagline?: string | null
  categoryId?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  status?: string | null
  verifiedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface OpsVendorConsent {
  id: string
  vendorProfileId: string
  consentType: string
  version: string
  givenAt: string
  ipAddress?: string | null
  userAgent?: string | null
  documentUrl?: string | null
  withdrawnAt?: string | null
}

export interface OpsConsentStatus {
  [key: string]: {
    required: boolean
    hasConsent: boolean
    consentedAt?: string | null
    version?: string | null
  }
}

export interface OpsVendorContract {
  id: string
  contractNumber?: string | null
  commissionRate?: number | null
  payoutFrequency?: string | null
  payoutHoldDays?: number | null
  minPayoutAmount?: number | null
  status?: string | null
  effectiveDate?: string | null
  expiryDate?: string | null
  signedByVendor?: boolean | null
  signedByPlatform?: boolean | null
  signedAt?: string | null
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  bankIfscCode?: string | null
  bankName?: string | null
  upiId?: string | null
  createdAt?: string | null
}

export interface OpsOnboardingStep {
  completed: boolean
  label: string
  status?: string
}

export interface OpsOnboardingStatus {
  steps: {
    profile: OpsOnboardingStep
    kyc: OpsOnboardingStep
    consents: OpsOnboardingStep
    contract: OpsOnboardingStep
    bankDetails: OpsOnboardingStep
  }
  progress: number
  isComplete: boolean
  completedSteps: number
  totalSteps: number
}

export interface OpsVendorOnboardingData {
  profile: OpsVendorProfile | null
  kyc: OpsKycRecord | null
  consents: OpsVendorConsent[]
  consentStatus: OpsConsentStatus | null
  contract: OpsVendorContract | null
  onboardingStatus: OpsOnboardingStatus
}

export interface OpsSupportTicket {
  id: string
  subject?: string | null
  status?: string | null
  createdAt?: string | null
}

export interface LeadConversionRequest {
  leadId: string
  opsAdminId: string
  opsManagerId?: string
  referenceImageId?: string
  venueName?: string
  venueAddressId?: string
  totalBudget?: number
}

export interface CreateActiveEventRequest {
  origin: 'DIGITAL_LEAD' | 'DIRECT_BOOKING'
  clientName: string
  clientEmail?: string
  clientPhone?: string
  eventType: string
  eventDate?: string
  eventEndDate?: string
  venueName?: string
  venueAddressId?: string
  totalBudget?: number
  opsManagerId?: string
}

export interface UpdateActiveEventRequest {
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  eventType?: string
  eventDate?: string
  eventEndDate?: string
  venueName?: string
  venueAddressId?: string
  totalBudget?: number
  opsManagerId?: string
}

export interface CreateOperationalTaskRequest {
  activeEventId: string
  title: string
  description?: string
  category?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  dueDate?: string
  assignedToUserId?: string
  assignedToVendorId?: string
  assignedBy: string
}

export interface UpdateOperationalTaskRequest {
  title?: string
  description?: string
  category?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  dueDate?: string
  assignedToUserId?: string
  assignedToVendorId?: string
}

export interface CreateRequirementSheetRequest {
  activeEventId: string
  notes?: string
}

export interface CreateRequirementItemRequest {
  category: string
  description: string
  quantity?: number
  estimatedBudget?: number
  priority?: string
  status?: string
  notes?: string
}

export interface CreateVendorAgreementRequest {
  activeEventId: string
  requirementItemId?: string
  vendorProfileId: string
  vendorName: string
  agreedAmount: number
  advancePaid?: number
  contractTerms?: string
  specialRequirements?: string
}

export interface UpdateVendorAgreementRequest {
  agreedAmount?: number
  advancePaid?: number
  contractTerms?: string
  specialRequirements?: string
  status?: 'DRAFT' | 'NEGOTIATING' | 'PENDING_SIGNATURE' | 'LOCKED' | 'FULFILLED' | 'CANCELLED'
  signedByVendor?: boolean
  signedByOps?: boolean
}

export interface CreateDisputeRequest {
  vendorProfileId: string
  reporterId: string
  type: 'SERVICE_QUALITY' | 'PRICING' | 'NO_SHOW' | 'HARASSMENT' | 'FRAUD' | 'OTHER'
  description: string
}

export interface OpsDashboardResponse {
  success: boolean
  data: OpsDashboardMetrics
  meta?: {
    timestamp?: string
    requestId?: string
    [key: string]: unknown
  }
}
