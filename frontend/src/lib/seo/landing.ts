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

const FILLER_WORDS = new Set(['wedding', 'weddings', 'event', 'events', 'and', 'best', 'top', 'in', 'india'])
const MIN_SHARED_PREFIX = 5

function significantTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !FILLER_WORDS.has(t))
}

function sharedPrefixLength(a: string, b: string): number {
  let n = 0
  while (n < a.length && n < b.length && a[n] === b[n]) n++
  return n
}

/**
 * Maps whatever category slug is in a URL to a real backend category slug, so categories are never hardcoded here.
 * Exact slug first; otherwise the closest category by shared word stems against its slug and name
 * ("wedding-planning" -> "planners", "photographers" -> "photography", "venues" -> "venue").
 * Returns null when nothing matches clearly (or two categories tie), so the page is a real 404.
 */
export async function resolveCategorySlug(raw: string): Promise<string | null> {
  const requested = raw.toLowerCase()
  const categories = await getCategories()
  if (categories.some((c) => c.slug === requested)) return requested

  const wanted = significantTokens(requested)
  if (!wanted.length) return null

  const scored = categories
    .map((category) => {
      const candidates = [...significantTokens(category.slug), ...significantTokens(category.name)]
      let score = 0
      for (const w of wanted) {
        for (const c of candidates) {
          const shared = sharedPrefixLength(w, c)
          const shorter = Math.min(w.length, c.length)
          if (shared >= MIN_SHARED_PREFIX || (shared === shorter && shorter >= 4)) score = Math.max(score, shared)
        }
      }
      return { slug: category.slug, score }
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)

  if (!scored.length) return null
  if (scored.length > 1 && scored[0].score === scored[1].score) return null
  return scored[0].slug
}
