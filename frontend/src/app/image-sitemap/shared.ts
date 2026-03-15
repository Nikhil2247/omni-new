const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com').replace(/\/$/, '')
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend.omnicassion.com/api'
    : 'http://localhost:3001/api')
).replace(/\/$/, '')

export const IMAGE_SITEMAP_PAGE_SIZE = 1000
export const IMAGE_SITEMAP_REVALIDATE_SECONDS = 3600

type DiscoveryMediaVendor = {
  slug?: string | null
  businessName?: string | null
}

type DiscoveryMediaItem = {
  type?: 'IMAGE' | 'VIDEO' | string | null
  url?: string | null
  cdnUrl?: string | null
  thumbnailUrl?: string | null
  altText?: string | null
  caption?: string | null
  createdAt?: string | Date | null
  vendor?: DiscoveryMediaVendor | null
}

type DiscoveryMediaResponse = {
  data?: DiscoveryMediaItem[]
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    hasNextPage?: boolean
    hasPreviousPage?: boolean
  }
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const toAbsoluteHttpUrl = (value?: string | null): string | null => {
  if (!value) return null

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

const toValidDate = (value?: string | Date | null): Date | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const pickImageUrl = (item: DiscoveryMediaItem): string | null =>
  toAbsoluteHttpUrl(item.cdnUrl) ||
  toAbsoluteHttpUrl(item.url) ||
  toAbsoluteHttpUrl(item.thumbnailUrl)

type ImageSitemapEntry = {
  pageUrl: string
  imageUrl: string
  imageTitle?: string | null
  imageCaption?: string | null
  lastModified?: Date
}

export type PaginatedImageSitemapData = {
  entries: ImageSitemapEntry[]
  totalPages: number
  total: number
}

export async function fetchImageSitemapPage(
  page: number,
  limit = IMAGE_SITEMAP_PAGE_SIZE,
): Promise<PaginatedImageSitemapData> {
  let response: Response
  try {
    response = await fetch(
      `${API_URL}/public/discovery/media?page=${page}&limit=${limit}&orderBy=newest`,
      {
        next: { revalidate: IMAGE_SITEMAP_REVALIDATE_SECONDS },
      },
    )
  } catch {
    return {
      entries: [],
      totalPages: 0,
      total: 0,
    }
  }

  if (!response.ok) {
    return {
      entries: [],
      totalPages: 0,
      total: 0,
    }
  }

  const payload = (await response.json()) as
    | DiscoveryMediaResponse
    | { data?: DiscoveryMediaResponse }

  const paginated = (payload as { data?: DiscoveryMediaResponse })?.data?.data
    ? (payload as { data?: DiscoveryMediaResponse }).data
    : (payload as DiscoveryMediaResponse)

  const items = Array.isArray(paginated?.data) ? paginated.data : []
  const entries: ImageSitemapEntry[] = []

  for (const item of items) {
    if (item?.type !== 'IMAGE') continue

    const slug = item.vendor?.slug?.trim()
    const imageUrl = pickImageUrl(item)
    if (!slug || !imageUrl) continue

    entries.push({
      pageUrl: `${SITE_URL}/vendors/${slug}`,
      imageUrl,
      imageTitle: item.altText || item.vendor?.businessName || null,
      imageCaption: item.caption || null,
      lastModified: toValidDate(item.createdAt) || undefined,
    })
  }

  return {
    entries,
    totalPages: Math.max(0, paginated?.meta?.totalPages || 0),
    total: Math.max(0, paginated?.meta?.total || 0),
  }
}

export function buildImageSitemapXml(entries: ImageSitemapEntry[]): string {
  if (entries.length === 0) {
    return `${XML_HEADER}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"></urlset>`
  }

  const rows = entries
    .map((entry) => {
      const lastmod = entry.lastModified
        ? `\n    <lastmod>${escapeXml(entry.lastModified.toISOString())}</lastmod>`
        : ''
      const title = entry.imageTitle
        ? `\n      <image:title>${escapeXml(entry.imageTitle)}</image:title>`
        : ''
      const caption = entry.imageCaption
        ? `\n      <image:caption>${escapeXml(entry.imageCaption)}</image:caption>`
        : ''

      return [
        '  <url>',
        `    <loc>${escapeXml(entry.pageUrl)}</loc>`,
        '    <image:image>',
        `      <image:loc>${escapeXml(entry.imageUrl)}</image:loc>${title}${caption}`,
        '    </image:image>',
        `${lastmod}`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  return `${XML_HEADER}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows}\n</urlset>`
}

export function buildImageSitemapIndexXml(pageCount: number): string {
  const safePageCount = Math.max(1, pageCount)

  const now = new Date().toISOString()

  const rows = Array.from({ length: safePageCount }, (_, index) => {
    const page = index + 1
    return [
      '  <sitemap>',
      `    <loc>${escapeXml(`${SITE_URL}/image-sitemap/${page}.xml`)}</loc>`,
      `    <lastmod>${escapeXml(now)}</lastmod>`,
      '  </sitemap>',
    ].join('\n')
  }).join('\n')

  return `${XML_HEADER}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>`
}
