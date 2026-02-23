import { MetadataRoute } from 'next';

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

async function fetchVendorSlugRoutes(currentDate: Date): Promise<MetadataRoute.Sitemap> {
  const slugMap = new Map<string, Date>()
  const limit = 200
  const maxPages = 50

  for (let page = 1; page <= maxPages; page++) {
    const response = await fetch(
      `${API_URL}/public/discovery/vendors?page=${page}&limit=${limit}`,
      {
        next: { revalidate: 3600 },
      },
    )

    if (!response.ok) break

    const payload = (await response.json()) as VendorsPageResponse | { data?: VendorsPageResponse }
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
    const response = await fetch(
      `${API_URL}/public/blog/posts?page=${page}&limit=${limit}&status=PUBLISHED`,
      {
        next: { revalidate: 3600 },
      },
    )

    if (!response.ok) break

    const payload = (await response.json()) as BlogPageResponse | { data?: BlogPageResponse }
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
  const currentDate = new Date();
  
  // Static pages with high priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/vendors`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/discover`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Auth pages
  const authRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/signin`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Vendor category pages (example categories)
  const categoryRoutes: MetadataRoute.Sitemap = [
    'photography',
    'videography',
    'catering',
    'venues',
    'entertainment',
    'decor-design',
    'florist',
    'makeup-hair',
    'mehndi-artists',
    'wedding-planning',
  ].map((category) => ({
    url: `${SITE_URL}/vendors/category/${category}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Onboarding pages
  const onboardingRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/onboarding`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let dynamicVendorRoutes: MetadataRoute.Sitemap = []
  let dynamicBlogRoutes: MetadataRoute.Sitemap = []
  try {
    dynamicVendorRoutes = await fetchVendorSlugRoutes(currentDate)
  } catch {
    dynamicVendorRoutes = []
  }

  try {
    dynamicBlogRoutes = await fetchBlogSlugRoutes(currentDate)
  } catch {
    dynamicBlogRoutes = []
  }

  return [
    ...staticRoutes,
    ...authRoutes,
    ...categoryRoutes,
    ...onboardingRoutes,
    ...dynamicVendorRoutes,
    ...dynamicBlogRoutes,
  ];
}
