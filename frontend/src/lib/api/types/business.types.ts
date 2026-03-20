// ============================================================================
// BUSINESS MODULE TYPES
// ============================================================================

// Vendor Profile
export interface VendorProfile {
  id: string
  userId: string
  businessName: string
  slug: string
  categoryId: string
  tagline?: string | null
  description?: string | null
  profilePhotoUrl?: string | null
  bannerImageUrl?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  website?: string | null
  addressId?: string | null
  serviceRadius?: number | null
  status: VendorStatus
  leadCount: number
  viewCount: number
  followersCount?: number | null
  reviewsCount?: number | null
  averageRating?: number | null
  verifiedAt?: string | null
  featuredUntil?: string | null
  isFollowing?: boolean
  createdAt: string
  updatedAt: string
  category?: {
    id: string
    name: string
    slug: string
  }
  address?: {
    id: string
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  services?: VendorService[]
  serviceAreas?: VendorServiceArea[]
  portfolios?: PortfolioItem[]
  badges?: VendorBadge[]
  eventHistory?: VendorEventHistory[]
}

export interface VendorServiceArea {
  id: string
  cityId: string
  radiusMiles?: number | null
  additionalFee?: number | null
  city?: {
    id: string
    name: string
    stateId?: string
  } | null
}

export type EventVendorStatus = 'SHORTLISTED' | 'CONTACTED' | 'BOOKED' | 'CONFIRMED' | 'CANCELLED'
export type EventStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface VendorEventHistory {
  id: string
  status: EventVendorStatus
  notes?: string | null
  contractAmount?: number | null
  depositPaid?: number | null
  createdAt: string
  event: {
    id: string
    name: string
    date?: string | null
    endDate?: string | null
    venueName?: string | null
    guestCount?: number | null
    description?: string | null
    status: EventStatus
    eventType?: {
      id: string
      name: string
      slug: string
    } | null
  }
}

export type VendorBadgeMetric = 'FOLLOWERS' | 'REVIEWS' | 'LEADS' | 'VIEWS'

export interface VendorBadgeDefinition {
  id: string
  key: string
  name: string
  description?: string | null
  metric: VendorBadgeMetric
  threshold: number
  icon?: string | null
  color?: string | null
}

export interface VendorBadge {
  id: string
  vendorProfileId: string
  badgeDefinitionId: string
  achievedAt: string
  definition?: VendorBadgeDefinition
}

export type VendorStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export interface CreateVendorProfileRequest {
  businessName: string
  slug?: string
  categoryId?: string
  tagline?: string
  description?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  addressId?: string
  serviceRadius?: number
  serviceAreaCityIds?: string[]
  bannerImageUrl?: string
}

export interface UpdateVendorProfileRequest extends Partial<CreateVendorProfileRequest> {
  status?: VendorStatus
}

// Media Types
export type CatalogMediaType = 'IMAGE' | 'VIDEO'

// Media Item - Individual media file within a portfolio
export interface MediaItem {
  id: string
  portfolioId: string
  type: CatalogMediaType
  url: string
  thumbnailUrl?: string | null
  cdnUrl?: string | null
  altText?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
  duration?: number | null
  size: number
  mimeType: string
  sortOrder: number
  isApproved: boolean
  createdAt: string
}

// Portfolio - Collection/Album of media items
export interface Portfolio {
  id: string
  vendorProfileId: string
  title: string
  description?: string | null
  sortOrder: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  mediaItems?: MediaItem[]
}

// Alias for backwards compatibility
export type PortfolioItem = Portfolio

// Create Portfolio Request
export interface CreatePortfolioRequest {
  vendorProfileId: string
  title: string
  description?: string
  sortOrder?: number
  isFeatured?: boolean
  mediaItems?: CreateMediaItemRequest[]
}

// Update Portfolio Request
export interface UpdatePortfolioRequest {
  title?: string
  description?: string
  sortOrder?: number
  isFeatured?: boolean
}

// Create Media Item Request
export interface CreateMediaItemRequest {
  type: CatalogMediaType
  url: string
  thumbnailUrl?: string
  cdnUrl?: string
  altText?: string
  caption?: string
  width?: number
  height?: number
  duration?: number
  size: number
  mimeType: string
  sortOrder?: number
  isApproved?: boolean
}

// Vendor Service
export interface VendorService {
  id: string
  vendorProfileId: string
  serviceTypeId?: string | null
  name: string
  description?: string | null
  pricingType?: 'FIXED' | 'RANGE' | 'STARTING_AT' | 'TIERED' | 'CONTACT_FOR_QUOTE'
  currency?: string
  startingPrice?: number | null
  maxPrice?: number | null
  basePrice?: number
  priceUnit?: string
  duration?: number | null
  isActive: boolean
  features?: string[]
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

export interface CreateServiceRequest {
  vendorProfileId: string
  name: string
  description?: string
  pricingType?: 'FIXED' | 'RANGE' | 'STARTING_AT' | 'TIERED' | 'CONTACT_FOR_QUOTE'
  currency?: string
  startingPrice?: number
  maxPrice?: number
  basePrice?: number
  priceUnit?: string
  duration?: number
  durationValue?: number
  durationUnit?: 'minutes' | 'hours' | 'day' | 'month'
  isActive?: boolean
  features?: string[]
}

export interface UpdateServiceRequest extends Partial<Omit<CreateServiceRequest, 'vendorProfileId'>> {}

// Business Leads
export interface BusinessLead {
  id: string
  vendorProfileId: string
  plannerId: string
  eventId?: string | null
  status: string
  source: string
  eventDate?: string | null
  eventType?: string | null
  guestCount?: number | null
  budget?: number | null
  initialMessage?: string | null
  createdAt: string
  updatedAt: string
  respondedAt?: string | null
  convertedAt?: string | null
  planner?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  }
  vendorProfile?: {
    id: string
    businessName?: string | null
    slug?: string | null
  }
}

// Accept Lead Response - Active Event created from lead conversion
export interface AcceptLeadResponse {
  id: string
  origin: string
  convertedFromLeadId?: string | null
  referenceImageId?: string | null
  clientName: string
  clientPhone?: string | null
  clientEmail?: string | null
  eventDate?: string | null
  eventEndDate?: string | null
  eventType: string
  venueName?: string | null
  venueAddressId?: string | null
  totalBudget?: number | null
  totalSpend: number
  opsAdminId?: string | null
  opsManagerId?: string | null
  status: string
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

// Business Review
export interface BusinessReview {
  id: string
  vendorProfileId: string
  reviewerId?: string
  rating: number
  title?: string | null
  body?: string | null
  status?: string
  reviewNotes?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  reviewer?: {
    id?: string
    firstName?: string | null
    lastName?: string | null
    avatarUrl?: string | null
  }
}

// Business Analytics
export interface BusinessAnalyticsSummary {
  totalLeads: number
  totalViews: number
  totalBookings: number
  totalRevenue: number
  averageRating: number
  reviewCount: number
  leadConversionRate: number
  periodComparison?: {
    leadsChange: number
    viewsChange: number
    bookingsChange: number
    revenueChange: number
  }
}

export interface BusinessMetrics {
  leads: MetricPoint[]
  views: MetricPoint[]
  bookings: MetricPoint[]
  revenue: MetricPoint[]
}

export interface MetricPoint {
  date: string
  value: number
}

// Business Agreement (from Ops)
export interface BusinessAgreement {
  id: string
  activeEventId: string
  vendorProfileId: string
  vendorName: string
  status: string
  agreedAmount: number
  advancePaid: number
  balanceDue: number
  contractTerms?: string | null
  specialRequirements?: string | null
  contractUrl?: string | null
  sentAt?: string | null
  acceptedAt?: string | null
  declinedAt?: string | null
  declineReason?: string | null
  createdAt: string
  updatedAt: string
  activeEvent?: {
    id: string
    clientName: string
    eventType: string
    eventDate?: string | null
    venueName?: string | null
  }
}

// Business Task (from Ops)
export interface BusinessTask {
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
  assignedToVendorId?: string | null
  createdAt: string
  updatedAt: string
  activeEvent?: {
    id: string
    clientName: string
    eventType: string
    eventDate?: string | null
  }
}

// API Response Types
export interface BusinessProfileResponse {
  success: boolean
  data: VendorProfile
}

export interface BusinessPortfolioListResponse {
  success: boolean
  data: PortfolioItem[]
}

export interface BusinessServicesListResponse {
  success: boolean
  data: VendorService[]
}

export interface BusinessLeadsListResponse {
  success: boolean
  data: BusinessLead[]
}

export interface BusinessReviewsListResponse {
  success: boolean
  data: BusinessReview[]
}

export interface BusinessAnalyticsSummaryResponse {
  success: boolean
  data: BusinessAnalyticsSummary
}

export interface BusinessAgreementsListResponse {
  success: boolean
  data: BusinessAgreement[]
}

export interface BusinessTasksListResponse {
  success: boolean
  data: BusinessTask[]
}

// Blocked Dates (Calendar)
export interface BlockedDate {
  id: string
  vendorProfileId: string
  date: string
  reason?: string | null
  isRecurring: boolean
  createdAt: string
}

export interface CreateBlockedDateRequest {
  vendorProfileId: string
  date: string
  reason?: string
  isRecurring?: boolean
}

// Extended Portfolio with upload
export interface PortfolioUploadRequest {
  vendorProfileId: string
  title: string
  description?: string
  tags?: string[]
  featured?: boolean
}

// Lead Status Options
export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST'
  | 'ARCHIVED'

// Task Status Options
export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'

// Task Priority Options
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Agreement Status Options
export type AgreementStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'LOCKED'
  | 'COMPLETED'
  | 'CANCELLED'

// ============================================================================
// KYC TYPES
// ============================================================================

export type KYCStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

export type DocumentType =
  | 'BUSINESS_LICENSE'
  | 'TAX_CERTIFICATE'
  | 'INSURANCE'
  | 'ID_DOCUMENT'
  | 'ADDRESS_PROOF'
  | 'OTHER'

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'

export interface VendorKYC {
  id: string
  vendorProfileId: string
  legalName: string
  businessType: string
  taxId?: string | null
  status: KYCStatus
  submittedAt?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  reviewerId?: string | null
  reviewedAt?: string | null
  expiryDate?: string | null
  createdAt: string
  updatedAt: string
  documents?: KYCDocument[]
}

export interface KYCDocument {
  id: string
  kycId: string
  type: DocumentType
  url: string
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
  status: DocumentStatus
  notes?: string | null
  reviewerId?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateKYCRequest {
  legalName: string
  businessType: string
  taxId?: string
}

export interface DocumentTypeInfo {
  type: DocumentType
  name: string
  description: string
  required: boolean
}

export interface DocumentTypesResponse {
  required: DocumentTypeInfo[]
  optional: DocumentTypeInfo[]
}

// ============================================================================
// CONTRACT TYPES
// ============================================================================

export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'EXPIRED'
export type PayoutFrequency = 'AFTER_EVENT' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ON_COMPLETION'
export type PayoutRecordStatus = 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface VendorContract {
  id?: string
  vendorProfileId?: string
  contractNumber?: string
  version?: number
  commissionRate: number
  minCommission?: number | null
  maxCommission?: number | null
  payoutFrequency: PayoutFrequency
  payoutHoldDays: number
  minPayoutAmount: number
  effectiveDate?: string | null
  expiryDate?: string | null
  status: ContractStatus
  signedByVendor: boolean
  signedByPlatform: boolean
  signedAt?: string | null
  vendorSignedAt?: string | null
  platformSignedAt?: string | null
  vendorSignatureIp?: string | null
  suspendedAt?: string | null
  suspendedReason?: string | null
  terminatedAt?: string | null
  terminatedReason?: string | null
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  bankIfscCode?: string | null
  bankName?: string | null
  upiId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ContractTerms {
  commissionRate: number
  payoutFrequency: PayoutFrequency
  payoutHoldDays: number
  minPayoutAmount: number
  effectiveDate: string
  expiryDate?: string | null
  status: ContractStatus
}

export interface UpdateBankDetailsRequest {
  bankAccountName?: string
  bankAccountNumber?: string
  bankIfscCode?: string
  bankName?: string
  upiId?: string
}

export interface PayoutRecord {
  id: string
  contractId: string
  vendorProfileId: string
  periodStart: string
  periodEnd: string
  grossEarnings: number
  totalCommission: number
  netPayout: number
  eventCount: number
  status: PayoutRecordStatus
  scheduledFor?: string | null
  processedAt?: string | null
  transactionRef?: string | null
  paymentMethod?: string | null
  failedAt?: string | null
  failureReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface ContractResponse {
  hasContract: boolean
  contract: VendorContract | null
}

export interface ContractTermsResponse {
  hasContract: boolean
  terms?: ContractTerms
}

export interface PayoutsResponse {
  payouts: PayoutRecord[]
}

// ============================================================================
// CONSENT TYPES
// ============================================================================

export type ConsentType =
  | 'TERMS_OF_SERVICE'
  | 'PRIVACY_POLICY'
  | 'MARKETING_EMAIL'
  | 'MARKETING_SMS'
  | 'MARKETING_PUSH'
  | 'DATA_PROCESSING'
  | 'PLATFORM_COMMISSION'
  | 'COOKIE_ESSENTIAL'
  | 'COOKIE_ANALYTICS'
  | 'COOKIE_MARKETING'

export interface VendorConsent {
  id: string
  vendorProfileId: string
  consentType: ConsentType
  version: string
  documentUrl?: string | null
  givenAt: string
  withdrawnAt?: string | null
  expiresAt?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  source?: string | null
  createdAt: string
  updatedAt: string
}

export interface ConsentTypeInfo {
  type: ConsentType
  name: string
  description: string
  version?: string
  documentUrl?: string | null
  content?: string | null
  summary?: string | null
}

export interface ConsentTypesResponse {
  required: ConsentTypeInfo[]
  optional: ConsentTypeInfo[]
}

export interface ConsentStatus {
  [key: string]: {
    hasConsent: boolean
    version?: string
    givenAt?: string
  }
}

export interface ConsentStatusResponse {
  status: ConsentStatus
  required: {
    hasAll: boolean
    missing: ConsentType[]
  }
}

export interface GiveConsentRequest {
  consentType: ConsentType
  version: string
  documentUrl?: string
}

export interface BulkConsentRequest {
  consents: GiveConsentRequest[]
}

export interface WithdrawConsentRequest {
  consentType: ConsentType
  version: string
}

export interface ConsentsResponse {
  consents: VendorConsent[]
}

// ============================================================================
// CONSENT DEFINITIONS
// ============================================================================

export interface ConsentDefinition {
  id: string
  consentType: ConsentType
  version: string
  title: string
  description?: string | null
  content?: string | null
  summary?: string | null
  documentUrl?: string | null
  isRequired: boolean
  isActive: boolean
  appliesToUsers: boolean
  appliesToVendors: boolean
  displayOrder: number
  effectiveFrom: string
  effectiveUntil?: string | null
  createdAt: string
  updatedAt: string
}

export interface ConsentDefinitionsResponse {
  required: ConsentDefinition[]
  optional: ConsentDefinition[]
}
