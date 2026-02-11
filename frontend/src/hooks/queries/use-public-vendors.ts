import { useQuery } from '@tanstack/react-query'
import { publicService } from '@/lib/api/services/public.service'
import type { VendorProfile, VendorSearchParams } from '@/lib/api/types/vendor.types'
import type { PortfolioMediaSearchParams } from '@/lib/api/types/portfolio-media.types'
import type { PaginatedResponse } from '@/lib/api/types/common.types'
import type { UseQueryOptions } from '@tanstack/react-query'

export const publicVendorKeys = {
  all: ['public-vendors'] as const,
  list: (filters: VendorSearchParams) => [...publicVendorKeys.all, 'list', filters] as const,
  detail: (slug: string) => [...publicVendorKeys.all, 'detail', slug] as const,
  featured: (limit: number) => [...publicVendorKeys.all, 'featured', limit] as const,
  category: (categoryId: string, limit: number) =>
    [...publicVendorKeys.all, 'category', categoryId, limit] as const,
  media: (filters: PortfolioMediaSearchParams) => [...publicVendorKeys.all, 'media', filters] as const,
}

export function usePublicVendors(
  filters: VendorSearchParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<VendorProfile>,
      unknown,
      PaginatedResponse<VendorProfile>,
      ReturnType<typeof publicVendorKeys.list>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: publicVendorKeys.list(filters),
    queryFn: () => publicService.getVendors(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function usePublicVendor(
  slug: string,
  options?: Omit<
    UseQueryOptions<
      VendorProfile,
      unknown,
      VendorProfile,
      ReturnType<typeof publicVendorKeys.detail>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: publicVendorKeys.detail(slug),
    queryFn: () => publicService.getVendorBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useFeaturedVendors(limit = 10) {
  return useQuery({
    queryKey: publicVendorKeys.featured(limit),
    queryFn: () => publicService.getFeatured(limit),
    staleTime: 10 * 60 * 1000,
  })
}

export function useVendorsByCategory(categoryId: string, limit = 20) {
  return useQuery({
    queryKey: publicVendorKeys.category(categoryId, limit),
    queryFn: () => publicService.getByCategory(categoryId, limit),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  })
}

export function usePublicMediaFeed(filters: PortfolioMediaSearchParams) {
  return useQuery({
    queryKey: publicVendorKeys.media(filters),
    queryFn: () => publicService.getDiscoveryMedia(filters),
    staleTime: 5 * 60 * 1000,
  })
}
