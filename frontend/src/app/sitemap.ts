import { MetadataRoute } from 'next';
import { withRetry } from '@/lib/seo/server-api';
import { getLandingPages } from '@/lib/seo/landing';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com').replace(/\/$/, '');
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

type VendorSitemapItem = {
  slug?: string | null
  updatedAt?: string | Date | null
}

type VendorsPageResponse = {
  data?: VendorSitemapItem[]
  meta?: {
    page?: number
    totalPages?: number
    hasNextPage?: boolean
  }
  success?: boolean
}

type BlogSitemapItem = {
  slug?: string | null
  updatedAt?: string | Date | null
  publishedAt?: string | Date | null
  status?: string | null
}

type BlogPageResponse = {
  data?: BlogSitemapItem[]
  meta?: {
    page?: number
    totalPages?: number
    hasNextPage?: boolean
  }
  success?: boolean
}

/**
 * GET from the public API with retries. A rate-limited response (429) used to end a loop early with `break`,
 * silently dropping every vendor after that page from the sitemap. Now it retries, and throws if it still fails
 * (so the previously generated sitemap keeps being served instead of a truncated one).
 */
async function fetchApi<T>(path: string): Promise<T> {
  return withRetry(async () => {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } })
    if (!response.ok) {
      const error = new Error(`API ${response.status} for ${path}`) as Error & { status?: number }
      error.status = response.status
      throw error
    }
    return (await response.json()) as T
  })
}

async function fetchVendorSlugRoutes(currentDate: Date): Promise<MetadataRoute.Sitemap> {
  const slugMap = new Map<string, Date>()
  const limit = 200
  const maxPages = 50

  for (let page = 1; page <= maxPages; page++) {
    const payload = await fetchApi<VendorsPageResponse | { data?: VendorsPageResponse }>(
      `/public/discovery/vendors?page=${page}&limit=${limit}`,
    )
    const paginated = (payload as { data?: VendorsPageResponse })?.data?.data
      ? (payload as { data?: VendorsPageResponse }).data
      : (payload as VendorsPageResponse)

    const vendors = Array.isArray(paginated?.data) ? paginated.data : []

    for (const vendor of vendors) {
      const slug = vendor?.slug?.trim()
      if (!slug) continue

      const parsedDate = vendor.updatedAt ? new Date(vendor.updatedAt) : currentDate
      slugMap.set(slug, Number.isNaN(parsedDate.getTime()) ? currentDate : parsedDate)
    }

    const hasNext = Boolean(paginated?.meta?.hasNextPage)
    const totalPages = paginated?.meta?.totalPages || page

    if (!hasNext || page >= totalPages) break
  }

  return Array.from(slugMap.entries()).map(([slug, lastModified]) => ({
    url: `${SITE_URL}/vendors/${slug}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))
}

async function fetchBlogSlugRoutes(currentDate: Date): Promise<MetadataRoute.Sitemap> {
  const slugMap = new Map<string, Date>()
  const limit = 100
  const maxPages = 30

  for (let page = 1; page <= maxPages; page++) {
    const payload = await fetchApi<BlogPageResponse | { data?: BlogPageResponse }>(
      `/public/blog/posts?page=${page}&limit=${limit}&status=PUBLISHED`,
    )
    const paginated = (payload as { data?: BlogPageResponse })?.data?.data
      ? (payload as { data?: BlogPageResponse }).data
      : (payload as BlogPageResponse)

    const posts = Array.isArray(paginated?.data) ? paginated.data : []

    for (const post of posts) {
      const slug = post?.slug?.trim()
      if (!slug) continue
      if (post?.status && post.status !== 'PUBLISHED') continue

      const sourceDate = post.publishedAt || post.updatedAt
      const parsedDate = sourceDate ? new Date(sourceDate) : currentDate
      slugMap.set(slug, Number.isNaN(parsedDate.getTime()) ? currentDate : parsedDate)
    }

    const hasNext = Boolean(paginated?.meta?.hasNextPage)
    const totalPages = paginated?.meta?.totalPages || page

    if (!hasNext || page >= totalPages) break
  }

  return Array.from(slugMap.entries()).map(([slug, lastModified]) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // lastModified is only emitted where we know a real date (vendors, blog posts). A sitemap where every URL says
  // "modified now" teaches Google to ignore lastmod entirely.
  const currentDate = new Date();

  // Static pages with high priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pricing`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/vendors`,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/discover`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // For Vendors - High value conversion page
    {
      url: `${SITE_URL}/for-vendors`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Legal & Trust pages
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/support`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Tool pages - High SEO value for long-tail keywords
    {
      url: `${SITE_URL}/event-budget-calculator`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/event-checklist-tool`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/event-timeline-generator`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/wedding-guest-list`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/rsvp-manager`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/digital-invite-generator`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Category and city landing pages come from real data: only combinations that have live vendors are listed.
  // (Login, sign-up and onboarding pages are intentionally NOT in the sitemap.)
  let landingPages: Awaited<ReturnType<typeof getLandingPages>> = []
  try {
    landingPages = await getLandingPages()
  } catch {
    landingPages = []
  }

  const categorySlugs = Array.from(new Set(landingPages.map((p) => p.categorySlug)))
  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((category) => ({
    url: `${SITE_URL}/vendors/category/${category}`,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  const citySpecificRoutes: MetadataRoute.Sitemap = landingPages.map((p) => ({
    url: `${SITE_URL}/vendors/${p.categorySlug}/${p.citySlug}`,
    changeFrequency: 'weekly' as const,
    priority: p.vendorCount >= 3 ? 0.85 : 0.7,
  }))

  let dynamicVendorRoutes: MetadataRoute.Sitemap = []
  let dynamicBlogRoutes: MetadataRoute.Sitemap = []
  // Errors propagate on purpose: serving the previous full sitemap is better than a truncated one.
  dynamicVendorRoutes = await fetchVendorSlugRoutes(currentDate)
  dynamicBlogRoutes = await fetchBlogSlugRoutes(currentDate)

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...citySpecificRoutes,
    ...dynamicVendorRoutes,
    ...dynamicBlogRoutes,
  ];
}
