import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessService } from '@/lib/api/services/business.service'
import type {
  VendorProfile,
  CreateVendorProfileRequest,
  UpdateVendorProfileRequest,
  Portfolio,
  PortfolioItem,
  MediaItem,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
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
  LeadStatus,
} from '@/lib/api/types/business.types'
import type { Timeline } from '@/lib/api/types/timeline.types'

// Query Keys
export const businessKeys = {
  all: ['business'] as const,
  profile: () => [...businessKeys.all, 'profile'] as const,
  portfolio: (vendorProfileId: string) => [...businessKeys.all, 'portfolio', vendorProfileId] as const,
  portfolioItem: (id: string) => [...businessKeys.all, 'portfolio-item', id] as const,
  services: (vendorProfileId: string) => [...businessKeys.all, 'services', vendorProfileId] as const,
  service: (id: string) => [...businessKeys.all, 'service', id] as const,
  leads: (params?: { status?: string; page?: number; limit?: number }) => [...businessKeys.all, 'leads', params || {}] as const,
  lead: (id: string) => [...businessKeys.all, 'lead', id] as const,
  reviews: () => [...businessKeys.all, 'reviews'] as const,
  review: (id: string) => [...businessKeys.all, 'review', id] as const,
  analyticsSummary: (days?: number) => [...businessKeys.all, 'analytics-summary', days] as const,
  analyticsMetrics: (startDate?: string, endDate?: string) => [...businessKeys.all, 'analytics-metrics', startDate, endDate] as const,
  agreements: (vendorProfileId: string) => [...businessKeys.all, 'agreements', vendorProfileId] as const,
  agreement: (id: string) => [...businessKeys.all, 'agreement', id] as const,
  tasks: (assignedToVendorId: string) => [...businessKeys.all, 'tasks', assignedToVendorId] as const,
  task: (id: string) => [...businessKeys.all, 'task', id] as const,
  calendar: (eventId: string) => [...businessKeys.all, 'calendar', eventId] as const,
  blockedDates: (vendorProfileId: string) => [...businessKeys.all, 'blocked-dates', vendorProfileId] as const,
}

// ==================== Profile Hooks ====================
export function useBusinessProfile() {
  return useQuery<VendorProfile>({
    queryKey: businessKeys.profile(),
    queryFn: async () => {
      const response = await businessService.getMyProfile()
      return response.data
    },
    staleTime: 60_000,
    retry: false,
  })
}

export function useCreateBusinessProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVendorProfileRequest) => businessService.createProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateVendorProfileRequest) => businessService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

export function useDeleteBusinessProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => businessService.deleteProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

export function useSubmitForVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => businessService.submitForVerification(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

export function useGenerateSlug() {
  return useMutation({
    mutationFn: (businessName: string) => businessService.generateSlug(businessName),
  })
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => businessService.uploadProfilePhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => businessService.deleteProfilePhoto(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

export function useUploadProfileBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => businessService.uploadProfileBanner(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

export function useDeleteProfileBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => businessService.deleteProfileBanner(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.profile() })
    },
  })
}

// ==================== Portfolio Hooks ====================
export function useBusinessPortfolio(vendorProfileId: string) {
  return useQuery<Portfolio[]>({
    queryKey: businessKeys.portfolio(vendorProfileId),
    queryFn: async () => {
      const response = await businessService.getPortfolio(vendorProfileId)
      return response.data || response as unknown as Portfolio[]
    },
    enabled: !!vendorProfileId,
  })
}

export function useCreatePortfolioItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePortfolioRequest) => businessService.createPortfolioItem(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.portfolio(variables.vendorProfileId) })
    },
  })
}

export function useUpdatePortfolioItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePortfolioRequest }) =>
      businessService.updatePortfolioItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => businessService.deletePortfolioItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useAddPortfolioMediaItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ portfolioId, payload }: { portfolioId: string; payload: CreateMediaItemRequest }) =>
      businessService.addPortfolioMediaItem(portfolioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useDeletePortfolioMediaItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mediaId: string) => businessService.deletePortfolioMediaItem(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useUpdatePortfolioMediaItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ mediaId, payload }: { mediaId: string; payload: { altText?: string | null; caption?: string | null } }) =>
      businessService.updatePortfolioMediaItem(mediaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

// ==================== Services Hooks ====================
export function useBusinessServices(vendorProfileId: string) {
  return useQuery<VendorService[]>({
    queryKey: businessKeys.services(vendorProfileId),
    queryFn: async () => {
      const response = await businessService.getServices(vendorProfileId)
      return response.data || response as unknown as VendorService[]
    },
    enabled: !!vendorProfileId,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateServiceRequest) => businessService.createService(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.services(variables.vendorProfileId) })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceRequest }) =>
      businessService.updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => businessService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

// ==================== Leads Hooks ====================
export function useBusinessLeads(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery<BusinessLead[]>({
    queryKey: businessKeys.leads(params),
    queryFn: async () => {
      const response = await businessService.getLeads(params)
      return response.data || response as unknown as BusinessLead[]
    },
  })
}

export function useCreateBusinessLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      plannerId: string
      source: 'INQUIRY' | 'DIRECT_MESSAGE' | 'PHONE' | 'EXTERNAL' | 'REFERRAL'
      eventDate?: string
      eventType?: string
      guestCount?: number
      budget?: number
      initialMessage?: string
    }) => businessService.createLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.leads() })
    },
  })
}

// ==================== Reviews Hooks ====================
export function useBusinessReviews() {
  return useQuery<BusinessReview[]>({
    queryKey: businessKeys.reviews(),
    queryFn: async () => {
      const response = await businessService.getReviews()
      return response.data || response as unknown as BusinessReview[]
    },
  })
}

// ==================== Analytics Hooks ====================
export function useBusinessAnalyticsSummary(days?: number) {
  return useQuery<BusinessAnalyticsSummary>({
    queryKey: businessKeys.analyticsSummary(days),
    queryFn: async () => {
      const response = await businessService.getAnalyticsSummary(days)
      return response.data
    },
    staleTime: 60_000,
  })
}

export function useBusinessAnalyticsMetrics(startDate?: string, endDate?: string) {
  return useQuery<BusinessMetrics>({
    queryKey: businessKeys.analyticsMetrics(startDate, endDate),
    queryFn: async () => {
      const response = await businessService.getAnalyticsMetrics(startDate, endDate)
      return response.data
    },
    staleTime: 60_000,
  })
}

// ==================== Agreements Hooks ====================
export function useBusinessAgreements(vendorProfileId: string) {
  return useQuery<BusinessAgreement[]>({
    queryKey: businessKeys.agreements(vendorProfileId),
    queryFn: async () => {
      const response = await businessService.getAgreements(vendorProfileId)
      return response.data || response as unknown as BusinessAgreement[]
    },
    enabled: !!vendorProfileId,
  })
}

export function useAcceptAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => businessService.acceptAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useDeclineAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      businessService.declineAgreement(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

// ==================== Tasks Hooks ====================
export function useBusinessTasks(assignedToVendorId: string) {
  return useQuery<BusinessTask[]>({
    queryKey: businessKeys.tasks(assignedToVendorId),
    queryFn: async () => {
      const response = await businessService.getTasks(assignedToVendorId)
      return response.data || response as unknown as BusinessTask[]
    },
    enabled: !!assignedToVendorId,
  })
}

// ==================== Calendar Hooks ====================
export function useBusinessCalendar(eventId: string) {
  return useQuery<Timeline>({
    queryKey: businessKeys.calendar(eventId),
    queryFn: async () => {
      const response = await businessService.getCalendar(eventId)
      return response.data || response as unknown as Timeline
    },
    enabled: !!eventId,
  })
}

export function useBlockedDates(vendorProfileId: string) {
  return useQuery<BlockedDate[]>({
    queryKey: businessKeys.blockedDates(vendorProfileId),
    queryFn: async () => {
      const response = await businessService.getBlockedDates(vendorProfileId)
      return response.data || response as unknown as BlockedDate[]
    },
    enabled: !!vendorProfileId,
  })
}

export function useCreateBlockedDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBlockedDateRequest) => businessService.createBlockedDate(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.blockedDates(variables.vendorProfileId) })
    },
  })
}

export function useDeleteBlockedDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => businessService.deleteBlockedDate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

// ==================== Portfolio Upload Hooks ====================
export function useUploadPortfolioImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      portfolioId,
      file,
      options,
    }: {
      portfolioId: string
      file: File
      options?: {
        altText?: string
      }
    }) => businessService.uploadPortfolioImage(portfolioId, file, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useUploadMultiplePortfolioImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ portfolioId, files }: { portfolioId: string; files: File[] }) =>
      businessService.uploadMultiplePortfolioImages(portfolioId, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useReorderPortfolioItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ portfolioId, itemIds }: { portfolioId: string; itemIds: string[] }) =>
      businessService.reorderPortfolioItems(portfolioId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

// ==================== Extended Leads Hooks ====================
export function useBusinessLead(id: string) {
  return useQuery<BusinessLead>({
    queryKey: businessKeys.lead(id),
    queryFn: async () => {
      const response = await businessService.getLead(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      businessService.updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useAcceptLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { venueName?: string; venueAddressId?: string; totalBudget?: number } }) =>
      businessService.acceptLead(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

// ==================== Extended Reviews Hooks ====================
export function useBusinessReview(id: string) {
  return useQuery<BusinessReview>({
    queryKey: businessKeys.review(id),
    queryFn: async () => {
      const response = await businessService.getReview(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useRespondToReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      businessService.respondToReview(id, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.reviews() })
    },
  })
}

// ==================== Extended Tasks Hooks ====================
export function useBusinessTask(id: string) {
  return useQuery<BusinessTask>({
    queryKey: businessKeys.task(id),
    queryFn: async () => {
      const response = await businessService.getTask(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      businessService.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}

export function useSubmitTaskProof() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files, notes }: { id: string; files: File[]; notes?: string }) =>
      businessService.submitTaskProof(id, files, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all })
    },
  })
}
