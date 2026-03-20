import { useQuery, useMutation } from '@tanstack/react-query'
import { adsService } from '@/lib/api/services/ads.service'
import type { BannerPlacement, ConversionType } from '@/lib/api/types/ads.types'

const adsKeys = {
  all: ['ads'] as const,
  featured: (limit?: number) => [...adsKeys.all, 'featured', limit] as const,
  featuredByCategory: (categoryId: string, limit?: number) =>
    [...adsKeys.all, 'featured', 'category', categoryId, limit] as const,
  banners: (placement?: BannerPlacement, categoryId?: string, limit?: number) =>
    [...adsKeys.all, 'banners', placement, categoryId, limit] as const,
  albums: (limit?: number) => [...adsKeys.all, 'albums', limit] as const,
  boostedVendors: () => [...adsKeys.all, 'boosted-vendors'] as const,
  isBoosted: (vendorProfileId: string) =>
    [...adsKeys.all, 'is-boosted', vendorProfileId] as const,
}

/**
 * Hook to fetch featured vendor listings
 */
export function useFeaturedListings(limit = 8) {
  return useQuery({
    queryKey: adsKeys.featured(limit),
    queryFn: () => adsService.getFeaturedListings(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch featured listings by category
 */
export function useFeaturedByCategory(categoryId: string, limit = 4) {
  return useQuery({
    queryKey: adsKeys.featuredByCategory(categoryId, limit),
    queryFn: () => adsService.getFeaturedByCategory(categoryId, limit),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch banner ads
 */
export function useBannerAds(
  placement: BannerPlacement = 'homepage',
  categoryId?: string,
  limit = 3,
) {
  return useQuery({
    queryKey: adsKeys.banners(placement, categoryId, limit),
    queryFn: () => adsService.getBannerAds(placement, categoryId, limit),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch promoted albums
 */
export function usePromotedAlbums(limit = 6) {
  return useQuery({
    queryKey: adsKeys.albums(limit),
    queryFn: () => adsService.getPromotedAlbums(limit),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch list of boosted vendors
 */
export function useBoostedVendors() {
  return useQuery({
    queryKey: adsKeys.boostedVendors(),
    queryFn: () => adsService.getBoostedVendors(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to check if a specific vendor is boosted
 */
export function useIsVendorBoosted(vendorProfileId: string) {
  return useQuery({
    queryKey: adsKeys.isBoosted(vendorProfileId),
    queryFn: () => adsService.isVendorBoosted(vendorProfileId),
    enabled: !!vendorProfileId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Mutation hook to record banner click
 */
export function useRecordBannerClick() {
  return useMutation({
    mutationFn: (campaignId: string) => adsService.recordBannerClick(campaignId),
  })
}

/**
 * Mutation hook to record boost impression
 */
export function useRecordBoostImpression() {
  return useMutation({
    mutationFn: (campaignId: string) => adsService.recordBoostImpression(campaignId),
  })
}

/**
 * Mutation hook to record boost click
 */
export function useRecordBoostClick() {
  return useMutation({
    mutationFn: (campaignId: string) => adsService.recordBoostClick(campaignId),
  })
}

/**
 * Mutation hook to record conversion
 */
export function useRecordConversion() {
  return useMutation({
    mutationFn: ({ vendorProfileId, type }: { vendorProfileId: string; type: ConversionType }) =>
      adsService.recordConversion(vendorProfileId, type),
  })
}
