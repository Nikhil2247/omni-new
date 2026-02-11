import { useQuery } from '@tanstack/react-query'
import { publicService } from '@/lib/api/services/public.service'
import type { BlogPostSearchParams } from '@/lib/api/types/marketing.types'
import type { BlogPost } from '@/lib/api/types/marketing.types'
import type { UseQueryOptions } from '@tanstack/react-query'

export const publicBlogKeys = {
  all: ['public-blog'] as const,
  list: (filters: BlogPostSearchParams) => [...publicBlogKeys.all, 'list', filters] as const,
  detail: (slug: string) => [...publicBlogKeys.all, 'detail', slug] as const,
  categories: () => [...publicBlogKeys.all, 'categories'] as const,
  tags: () => [...publicBlogKeys.all, 'tags'] as const,
}

export function usePublicBlogPosts(filters: BlogPostSearchParams) {
  return useQuery({
    queryKey: publicBlogKeys.list(filters),
    queryFn: () => publicService.getBlogPosts(filters),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePublicBlogPost(
  slug: string,
  options?: Omit<
    UseQueryOptions<
      BlogPost,
      unknown,
      BlogPost,
      ReturnType<typeof publicBlogKeys.detail>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: publicBlogKeys.detail(slug),
    queryFn: () => publicService.getBlogPostBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function usePublicBlogCategories() {
  return useQuery({
    queryKey: publicBlogKeys.categories(),
    queryFn: () => publicService.getBlogCategories(),
    staleTime: 30 * 60 * 1000,
  })
}

export function usePublicBlogTags() {
  return useQuery({
    queryKey: publicBlogKeys.tags(),
    queryFn: () => publicService.getBlogTags(),
    staleTime: 30 * 60 * 1000,
  })
}
