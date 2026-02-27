import { ApiResponse } from '@/types'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  VendorProfile,
  CreateVendorProfileRequest,
  UpdateVendorProfileRequest,
  Portfolio,
  PortfolioItem,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  MediaItem,
  CreateMediaItemRequest,
  VendorService,
  CreateServiceRequest,
  UpdateServiceRequest,
  BusinessLead,
  BusinessReview,
  BusinessAnalyticsSummary,
  BusinessMetrics,
  BusinessAgreement,
  BusinessTask,
  BlockedDate,
  CreateBlockedDateRequest,
} from '../types/business.types'
import type { Timeline } from '../types/timeline.types'
import type { UploadedFile } from './upload.service'

const inferPriceUnit = (service: any): string => {
  if (service?.priceUnit) return service.priceUnit

  switch (service?.pricingType) {
    case 'FIXED':
      return 'fixed'
    case 'RANGE':
    case 'STARTING_AT':
    case 'TIERED':
    case 'CONTACT_FOR_QUOTE':
    default:
      return 'per_event'
  }
}

const normalizeVendorService = (service: any): VendorService => {
  const rawBasePrice =
    service?.basePrice ??
    service?.startingPrice ??
    service?.minPrice ??
    0

  const parsedBasePrice =
    typeof rawBasePrice === 'number'
      ? rawBasePrice
      : Number(rawBasePrice)

  return {
    ...service,
    basePrice: Number.isFinite(parsedBasePrice) ? parsedBasePrice : 0,
    priceUnit: inferPriceUnit(service),
    duration:
      service?.duration === null || service?.duration === undefined
        ? null
        : Number(service.duration),
    features: Array.isArray(service?.features) ? service.features : [],
  }
}

const normalizeVendorServicesResponse = <T>(data: T): T => {
  const payload: any = (data as any)?.data ?? data

  if (Array.isArray(payload)) {
    const normalized = payload.map(normalizeVendorService)
    if ((data as any)?.data) {
      return { ...(data as any), data: normalized } as T
    }
    return normalized as T
  }

  if (payload && typeof payload === 'object' && payload.id) {
    const normalized = normalizeVendorService(payload)
    if ((data as any)?.data) {
      return { ...(data as any), data: normalized } as T
    }
    return normalized as T
  }

  return data
}

export const businessService = {
  // ==================== Profile ====================
  getMyProfile: async (): Promise<ApiResponse<VendorProfile>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.PROFILE.ME)
    return data
  },

  createProfile: async (payload: CreateVendorProfileRequest): Promise<ApiResponse<VendorProfile>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PROFILE.CREATE, payload)
    return data
  },

  updateProfile: async (payload: UpdateVendorProfileRequest): Promise<ApiResponse<VendorProfile>> => {
    const { data } = await apiClient.put(API_ENDPOINTS.BUSINESS.PROFILE.ME, payload)
    return data
  },

  deleteProfile: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BUSINESS.PROFILE.ME)
  },

  submitForVerification: async (): Promise<ApiResponse<VendorProfile>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PROFILE.VERIFY)
    return data
  },

  generateSlug: async (businessName: string): Promise<{ slug: string }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PROFILE.GENERATE_SLUG, { businessName })
    return data?.data ?? data
  },

  uploadProfilePhoto: async (file: File): Promise<ApiResponse<VendorProfile>> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PROFILE.PHOTO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  deleteProfilePhoto: async (): Promise<ApiResponse<VendorProfile>> => {
    const { data } = await apiClient.delete(API_ENDPOINTS.BUSINESS.PROFILE.PHOTO)
    return data
  },

  uploadProfileBanner: async (file: File): Promise<ApiResponse<VendorProfile>> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PROFILE.BANNER, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  deleteProfileBanner: async (): Promise<ApiResponse<VendorProfile>> => {
    const { data } = await apiClient.delete(API_ENDPOINTS.BUSINESS.PROFILE.BANNER)
    return data
  },

  // ==================== Portfolio ====================
  getPortfolio: async (vendorProfileId: string): Promise<ApiResponse<Portfolio[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.PORTFOLIO, { params: { vendorProfileId } })
    return data
  },

  getPortfolioItem: async (id: string): Promise<ApiResponse<PortfolioItem>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.PORTFOLIO_BY_ID(id))
    return data
  },

  createPortfolioItem: async (payload: CreatePortfolioRequest): Promise<ApiResponse<PortfolioItem>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PORTFOLIO, payload)
    return data
  },

  updatePortfolioItem: async (id: string, payload: UpdatePortfolioRequest): Promise<ApiResponse<PortfolioItem>> => {
    const { data } = await apiClient.put(API_ENDPOINTS.BUSINESS.PORTFOLIO_BY_ID(id), payload)
    return data
  },

  deletePortfolioItem: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(API_ENDPOINTS.BUSINESS.PORTFOLIO_BY_ID(id))
    return data
  },

  uploadPortfolioImage: async (
    portfolioId: string,
    file: File,
    options?: {
      altText?: string
      caption?: string
    }
  ): Promise<ApiResponse<MediaItem>> => {
    const formData = new FormData()
    formData.append('file', file)
    if (options?.altText) formData.append('altText', options.altText)
    if (options?.caption) formData.append('caption', options.caption)

    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PORTFOLIO_UPLOAD(portfolioId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  uploadMultiplePortfolioImages: async (
    portfolioId: string,
    files: File[]
  ): Promise<ApiResponse<MediaItem[]>> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PORTFOLIO_UPLOAD_MULTIPLE(portfolioId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  reorderPortfolioItems: async (portfolioId: string, itemIds: string[]): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.BUSINESS.PORTFOLIO_REORDER(portfolioId), {
      itemIds,
    })
  },

  addPortfolioMediaItem: async (
    portfolioId: string,
    payload: CreateMediaItemRequest
  ): Promise<ApiResponse<MediaItem>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.PORTFOLIO_MEDIA(portfolioId), payload)
    return data
  },

  deletePortfolioMediaItem: async (mediaId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(API_ENDPOINTS.BUSINESS.PORTFOLIO_MEDIA_DELETE(mediaId))
    return data
  },

  updatePortfolioMediaItem: async (
    mediaId: string,
    payload: { altText?: string | null; caption?: string | null },
  ): Promise<ApiResponse<MediaItem>> => {
    const { data } = await apiClient.put(API_ENDPOINTS.BUSINESS.PORTFOLIO_MEDIA_UPDATE(mediaId), payload)
    return data
  },

  // ==================== Services ====================
  getServices: async (vendorProfileId: string): Promise<ApiResponse<VendorService[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.SERVICES, { params: { vendorProfileId } })
    return normalizeVendorServicesResponse(data)
  },

  getService: async (id: string): Promise<ApiResponse<VendorService>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.SERVICE_BY_ID(id))
    return normalizeVendorServicesResponse(data)
  },

  createService: async (payload: CreateServiceRequest): Promise<ApiResponse<VendorService>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SERVICES, payload)
    return normalizeVendorServicesResponse(data)
  },

  updateService: async (id: string, payload: UpdateServiceRequest): Promise<ApiResponse<VendorService>> => {
    const { data } = await apiClient.put(API_ENDPOINTS.BUSINESS.SERVICE_BY_ID(id), payload)
    return normalizeVendorServicesResponse(data)
  },

  deleteService: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(API_ENDPOINTS.BUSINESS.SERVICE_BY_ID(id))
    return data
  },

  // ==================== Leads ====================
  getLeads: async (params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<BusinessLead[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.LEADS, { params })
    return data
  },

  createLead: async (payload: {
    plannerId: string
    source: 'INQUIRY' | 'DIRECT_MESSAGE' | 'PHONE' | 'EXTERNAL' | 'REFERRAL'
    eventDate?: string
    eventType?: string
    guestCount?: number
    budget?: number
    initialMessage?: string
  }): Promise<ApiResponse<BusinessLead>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.LEADS, payload)
    return data
  },

  // ==================== Reviews ====================
  getReviews: async (): Promise<ApiResponse<BusinessReview[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.VENDOR_REVIEWS)
    return data
  },

  // ==================== Analytics ====================
  getAnalyticsSummary: async (days?: number): Promise<ApiResponse<BusinessAnalyticsSummary>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.ANALYTICS.SUMMARY, { params: { days } })
    return data
  },

  getAnalyticsMetrics: async (startDate?: string, endDate?: string): Promise<ApiResponse<BusinessMetrics>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.ANALYTICS.METRICS, { params: { startDate, endDate } })
    return data
  },

  // ==================== Agreements ====================
  getAgreements: async (vendorProfileId: string): Promise<ApiResponse<BusinessAgreement[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.AGREEMENTS, { params: { vendorProfileId } })
    return data
  },

  getAgreement: async (id: string): Promise<ApiResponse<BusinessAgreement>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.AGREEMENT_BY_ID(id))
    return data
  },

  acceptAgreement: async (id: string): Promise<ApiResponse<BusinessAgreement>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.AGREEMENT_ACCEPT(id))
    return data
  },

  declineAgreement: async (id: string, reason?: string): Promise<ApiResponse<BusinessAgreement>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.AGREEMENT_DECLINE(id), { reason })
    return data
  },

  // ==================== Tasks ====================
  getTasks: async (assignedToVendorId: string): Promise<ApiResponse<BusinessTask[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.TASKS, { params: { assignedToVendorId } })
    return data
  },

  // ==================== Calendar ====================
  getCalendar: async (eventId: string): Promise<ApiResponse<Timeline>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.CALENDAR, { params: { eventId } })
    return data
  },

  getBlockedDates: async (vendorProfileId: string): Promise<ApiResponse<BlockedDate[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.BLOCKED_DATES, { params: { vendorProfileId } })
    return data
  },

  createBlockedDate: async (payload: CreateBlockedDateRequest): Promise<ApiResponse<BlockedDate>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.BLOCKED_DATES, payload)
    return data
  },

  deleteBlockedDate: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BUSINESS.BLOCKED_DATE_BY_ID(id))
  },

  // ==================== Extended Leads ====================
  getLead: async (id: string): Promise<ApiResponse<BusinessLead>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.LEAD_BY_ID(id))
    return data
  },

  updateLeadStatus: async (id: string, status: string): Promise<ApiResponse<BusinessLead>> => {
    const { data } = await apiClient.put(API_ENDPOINTS.BUSINESS.LEAD_STATUS(id), { status })
    return data
  },

  acceptLead: async (
    id: string,
    payload?: { venueName?: string; venueAddressId?: string; totalBudget?: number },
  ) => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.LEAD_ACCEPT(id), payload || {})
    return data
  },

  // ==================== Extended Reviews ====================
  getReview: async (id: string): Promise<ApiResponse<BusinessReview>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.VENDOR_REVIEWS)
    const reviews = data?.data || data || []
    const match = Array.isArray(reviews) ? reviews.find((review) => review.id === id) : null
    return { success: Boolean(match), data: match }
  },

  respondToReview: async (id: string, response: string): Promise<ApiResponse<BusinessReview>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.VENDOR_REVIEW_RESPONSE(id), { response })
    return data
  },

  // ==================== Extended Tasks ====================
  getTask: async (id: string): Promise<ApiResponse<BusinessTask>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.TASK_BY_ID(id))
    return data
  },

  updateTaskStatus: async (id: string, status: string): Promise<ApiResponse<BusinessTask>> => {
    const { data } = await apiClient.put(API_ENDPOINTS.BUSINESS.TASK_STATUS(id), { status })
    return data
  },

  submitTaskProof: async (
    id: string,
    files: File[],
    notes?: string
  ): Promise<ApiResponse<BusinessTask>> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    if (notes) formData.append('notes', notes)

    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.TASK_PROOF(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
