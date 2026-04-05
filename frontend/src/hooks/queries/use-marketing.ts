import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { marketingService } from '@/lib/api/services/marketing.service'
import type {
  BlogPostCreatePayload,
  BlogPostSearchParams,
  BlogPostUpdatePayload,
  MarketingCampaignSearchParams,
  MarketingCampaignStats,
  MarketingCampaignUpdatePayload,
} from '@/lib/api/types/marketing.types'

const marketingKeys = {
  campaigns: () => ['marketing-campaigns'] as const,
  campaignList: (params: MarketingCampaignSearchParams) => ['marketing-campaigns', 'list', params] as const,
  campaign: (id: string) => ['marketing-campaigns', 'detail', id] as const,
  campaignStats: (id: string) => ['marketing-campaigns', 'stats', id] as const,
  categories: () => ['marketing-categories'] as const,
  media: () => ['marketing-media'] as const,
  promotions: () => ['marketing-promotions'] as const,
  blogPosts: (params: BlogPostSearchParams) => ['marketing-blog-posts', params] as const,
  blogPost: (id: string) => ['marketing-blog-post', id] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response
    const message = response?.data?.message
    if (Array.isArray(message) && message.length) {
      return message[0]
    }
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: marketingKeys.campaigns(),
    queryFn: () => marketingService.listCampaigns(),
  })
}

export function useMarketingCampaignList(params: MarketingCampaignSearchParams) {
  return useQuery({
    queryKey: marketingKeys.campaignList(params),
    queryFn: () => marketingService.searchCampaigns(params),
  })
}

export function useMarketingCampaign(id: string) {
  return useQuery({
    queryKey: marketingKeys.campaign(id),
    queryFn: () => marketingService.getCampaign(id),
    enabled: Boolean(id),
  })
}

export function useMarketingCampaignStats(id: string) {
  return useQuery<MarketingCampaignStats>({
    queryKey: marketingKeys.campaignStats(id),
    queryFn: () => marketingService.getCampaignStats(id),
    enabled: Boolean(id),
  })
}

export function useMarketingCategories() {
  return useQuery({
    queryKey: marketingKeys.categories(),
    queryFn: () => marketingService.listCategories(),
  })
}

export function useMarketingMedia() {
  return useQuery({
    queryKey: marketingKeys.media(),
    queryFn: () => marketingService.listMedia(),
  })
}

export function useMarketingPromotions() {
  return useQuery({
    queryKey: marketingKeys.promotions(),
    queryFn: () => marketingService.listPromotions(),
  })
}

export function useBlogPosts(params: BlogPostSearchParams) {
  return useQuery({
    queryKey: marketingKeys.blogPosts(params),
    queryFn: () => marketingService.searchBlogPosts(params),
  })
}

export function useBlogPost(id: string) {
  return useQuery({
    queryKey: marketingKeys.blogPost(id),
    queryFn: () => marketingService.getBlogPost(id),
    enabled: Boolean(id),
  })
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BlogPostCreatePayload) => marketingService.createBlogPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPosts({}) })
      toast.success('Blog post created successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to create blog post')),
  })
}

export function useUpdateBlogPost(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BlogPostUpdatePayload) => marketingService.updateBlogPost(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPost(id) })
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPosts({}) })
      toast.success('Blog post updated successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update blog post')),
  })
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marketingService.deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPosts({}) })
      toast.success('Blog post deleted successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to delete blog post')),
  })
}

export function usePublishBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marketingService.publishBlogPost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPost(id) })
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPosts({}) })
      toast.success('Blog post published successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to publish blog post')),
  })
}

export function useUpdateMarketingCampaign(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MarketingCampaignUpdatePayload) => marketingService.updateCampaign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns', 'list'] })
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaign(id) })
      toast.success('Campaign updated successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update campaign')),
  })
}

export function usePauseMarketingCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marketingService.pauseCampaign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns', 'list'] })
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaign(id) })
      toast.success('Campaign paused successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to pause campaign')),
  })
}

export function useResumeMarketingCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marketingService.resumeCampaign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns', 'list'] })
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaign(id) })
      toast.success('Campaign resumed successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to resume campaign')),
  })
}

export function useCancelMarketingCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marketingService.cancelCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns', 'list'] })
      toast.success('Campaign deleted successfully')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to delete campaign')),
  })
}
