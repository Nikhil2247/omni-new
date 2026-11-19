import { cache } from 'react'
import { publicService } from '@/lib/api/services/public.service'
import type { VendorProfile } from '@/lib/api/types/vendor.types'
import { fetchPublicJson, NotFoundError, withRetry } from './server-api'

/** A (category, city) combination that has at least one live vendor. Only these get an indexable landing page. */
export interface LandingPage {
  categorySlug: string
  categoryName: string
  citySlug: string
  cityId: string
  cityName: string
  state: string | null
  vendorCount: number
}

export interface SeoCategory {
  id: string
  name: string
  slug: string
  description?: string | null
}

/**
 * All category x city combinations with real vendors. Cached by Next for an hour.
 * If the endpoint is not available yet (older backend), we return an empty list so pages 404 cleanly
 * instead of serving thin placeholder content.
 */
export const getLandingPages = cache(async (): Promise<LandingPage[]> => {
  try {
    const data = await fetchPublicJson<LandingPage[]>('/public/lookups/vendor-landing-pages', 3600)
    return Array.isArray(data) ? data : []
  } catch (error) {
    if (error instanceof NotFoundError) return []
    throw error
  }
})

export async function findLandingPage(categorySlug: string, citySlug: string): Promise<LandingPage | null> {
  const pages = await getLandingPages()
  const c = categorySlug.toLowerCase()
  const s = citySlug.toLowerCase()
  return pages.find((p) => p.categorySlug === c && p.citySlug === s) ?? null
}

/** The real vendor categories from the API (slug, name, description). */
export const getCategories = cache(async (): Promise<SeoCategory[]> => {
  const data = await fetchPublicJson<SeoCategory[]>('/public/discovery/categories', 3600)
  return Array.isArray(data) ? data : []
})

export async function findCategory(slug: string): Promise<SeoCategory | null> {
  const categories = await getCategories()
  return categories.find((c) => c.slug === slug.toLowerCase()) ?? null
}

export interface VendorPageResult {
  vendors: VendorProfile[]
  total: number
}

/**
 * One page of vendors plus the REAL total (from the API's pagination meta). Retries rate limits and throws if it
 * still fails, so a hiccup never turns into an empty page that gets indexed.
 */
export const getVendorPage = cache(async (categorySlug: string | undefined, limit: number): Promise<VendorPageResult> => {
  try {
    const response = await withRetry(() =>
      publicService.getVendors({
        ...(categorySlug ? { categoryId: categorySlug } : {}),
        limit,
        sortBy: 'viewCount',
        sortOrder: 'desc',
      }),
    )
    const vendors = response?.data ?? []
    return { vendors, total: response?.meta?.total ?? vendors.length }
  } catch (error) {
    if (error instanceof NotFoundError) return { vendors: [], total: 0 }
    throw error
  }
})

/** "Venue" -> "Venues", "Photography" -> "Photography", "Food & Catering" -> "Food & Catering". */
export function pluralizeCategory(name: string): string {
  const trimmed = name.trim()
  if (/(ing|s|ment|ography|ation)$/i.test(trimmed) || /&/.test(trimmed)) return trimmed
  if (/y$/i.test(trimmed) && !/[aeiou]y$/i.test(trimmed)) return `${trimmed.slice(0, -1)}ies`
  return `${trimmed}s`
}

/** Old hardcoded category slugs that were in the sitemap/links, mapped to the real slug where one exists. */
export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  venues: 'venue',
}
