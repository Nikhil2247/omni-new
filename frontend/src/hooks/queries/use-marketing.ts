import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { marketingService } from '@/lib/api/services/marketing.service'
import type { BlogPostCreatePayload, BlogPostSearchParams, BlogPostUpdatePayload } from '@/lib/api/types/marketing.types'

const marketingKeys = {
  campaigns: () => ['marketing-campaigns'] as const,
  categories: () => ['marketing-categories'] as const,
  media: () => ['marketing-media'] as const,
  promotions: () => ['marketing-promotions'] as const,
  blogPosts: (params: BlogPostSearchParams) => ['marketing-blog-posts', params] as const,
  blogPost: (id: string) => ['marketing-blog-post', id] as const,
}

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: marketingKeys.campaigns(),
    queryFn: () => marketingService.listCampaigns(),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: marketingKeys.blogPosts({}) }),
  })
}

export function useUpdateBlogPost(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BlogPostUpdatePayload) => marketingService.updateBlogPost(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPost(id) })
      queryClient.invalidateQueries({ queryKey: marketingKeys.blogPosts({}) })
    },
  })
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marketingService.deleteBlogPost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: marketingKeys.blogPosts({}) }),
  })
}
