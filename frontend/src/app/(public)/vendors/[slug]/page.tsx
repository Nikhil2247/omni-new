import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import VendorPageClient from './vendor-page-client'
import { pageMetadata, generateJsonLd } from '@/lib/seo/metadata'
import { publicService } from '@/lib/api/services/public.service'
import type { VendorProfile } from '@/lib/api/types/vendor.types'
import type { JsonLdSchema } from '@/lib/seo/types'
import { getVendorKeywords, categoryKeywords } from '@/lib/seo/keywords'
import { NotFoundError, withRetry } from '@/lib/seo/server-api'

// Rendered once, then served from cache and refreshed hourly. Crawlers get fast, stable HTML and we stop
// hitting the (rate-limited) API on every bot request.
export const revalidate = 3600
export const dynamicParams = true
export async function generateStaticParams() {
  return []
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

type VendorAddress = {
  street?: string | null
  addressLine1?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
}

type VendorMediaItem = {
  type?: 'IMAGE' | 'VIDEO' | string | null
  url?: string | null
  thumbnailUrl?: string | null
  cdnUrl?: string | null
}

type VendorPortfolio = {
  mediaItems?: VendorMediaItem[] | null
}

type VendorService = {
  id?: string
  name?: string
  currency?: string | null
  pricingType?: 'FIXED' | 'RANGE' | 'STARTING_AT' | 'TIERED' | 'CONTACT_FOR_QUOTE' | string
  startingPrice?: number | null
  maxPrice?: number | null
  isActive?: boolean
}

type VendorWithSeoFields = VendorProfile & {
  address?: VendorAddress | null
  portfolios?: VendorPortfolio[]
  services?: VendorService[]
}

/**
 * Returns the vendor, or null ONLY when the API says it does not exist (404).
 * Temporary API failures (429 / 5xx) are retried and then thrown, so a hiccup never turns a valid vendor page
 * into a cached "not found / noindex" page.
 */
const getVendorBySlug = cache(async (slug: string | undefined): Promise<VendorProfile | null> => {
  if (!slug) return null
  try {
    return await withRetry(() => publicService.getVendorBySlug(slug))
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
})

/** Plain text from the vendor's HTML description (it is stored as rich text). */
function stripHtml(value?: string | null): string {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`
}

function buildDescription(vendor: VendorProfile) {
  const extendedVendor = vendor as VendorWithSeoFields
  const city = extendedVendor.address?.city
  const categoryName = vendor.category?.name
  const rated = typeof vendor.averageRating === 'number' && (vendor.reviewsCount || 0) > 0
  const ratingText = rated
    ? ` Rated ${vendor.averageRating!.toFixed(1)}/5 by ${vendor.reviewsCount} customers.`
    : ''

  const lead = [vendor.businessName, categoryName && city ? `${categoryName} in ${city}` : categoryName || city]
    .filter(Boolean)
    .join(' – ')
  const cta = ' See photos, services & get a free quote on Omnicassion.'
  const snippetSource = stripHtml(vendor.tagline) || stripHtml(vendor.description)
  const room = 158 - lead.length - ratingText.length - cta.length - 3
  const snippet = snippetSource && room > 30 ? ` ${truncate(snippetSource, room)}` : ''

  return `${lead}.${snippet}${ratingText}${cta}`.replace(/\s+/g, ' ').trim()
}

function buildKeywords(vendor: VendorProfile) {
  const extendedVendor = vendor as VendorWithSeoFields
  const city = extendedVendor.address?.city || undefined
  const state = extendedVendor.address?.state || undefined
  const categoryName = vendor.category?.name
  const categorySlug = vendor.category?.slug

  // Use centralized keyword generator for comprehensive coverage
  if (categorySlug) {
    return getVendorKeywords(
      vendor.businessName,
      categorySlug,
      city,
      state
    )
  }

  // Fallback for vendors without category
  const keywords = [
    // Brand keywords
    vendor.businessName,
    `${vendor.businessName} reviews`,
    `${vendor.businessName} portfolio`,
    `${vendor.businessName} prices`,
    `${vendor.businessName} contact`,

    // Category keywords
    categoryName ? `${categoryName}` : null,
    categoryName ? `best ${categoryName}` : null,
    categoryName ? `${categoryName} near me` : null,
    categoryName ? `top ${categoryName} India` : null,
    categoryName ? `hire ${categoryName}` : null,
    categoryName ? `book ${categoryName}` : null,

    // Location-based keywords (critical for local SEO)
    city ? `${categoryName || 'vendor'} in ${city}` : null,
    city ? `best ${categoryName || 'vendors'} ${city}` : null,
    city && state ? `${categoryName || 'vendor'} ${city} ${state}` : null,
    city ? `wedding services ${city}` : null,

    // Generic high-intent keywords
    'wedding vendors India',
    'event services booking',
    'verified vendors Omnicassion',
    'book vendor online',
  ].filter(Boolean) as string[]

  return Array.from(new Set(keywords)).slice(0, 20)
}

function toAbsoluteHttpUrl(value?: string | null): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

function collectVendorImages(vendor: VendorWithSeoFields): string[] {
  const candidateUrls: Array<string | null | undefined> = [vendor.bannerImageUrl, vendor.profilePhotoUrl]

  for (const portfolio of vendor.portfolios || []) {
    for (const media of portfolio.mediaItems || []) {
      if (media?.type && media.type !== 'IMAGE') continue
      candidateUrls.push(media?.cdnUrl, media?.url, media?.thumbnailUrl)
      if (candidateUrls.length >= 40) break
    }
    if (candidateUrls.length >= 40) break
  }

  const unique = new Set<string>()
  for (const url of candidateUrls) {
    const safeUrl = toAbsoluteHttpUrl(url)
    if (!safeUrl) continue
    unique.add(safeUrl)
    if (unique.size >= 10) break
  }

  return Array.from(unique)
}

function computePriceRange(vendor: VendorWithSeoFields): string | undefined {
  const services = (vendor.services || []).filter((service) => service?.isActive !== false)
  const prices: number[] = []

  for (const service of services) {
    if (typeof service.startingPrice === 'number' && service.startingPrice > 0) {
      prices.push(service.startingPrice)
    }
    if (typeof service.maxPrice === 'number' && service.maxPrice > 0) {
      prices.push(service.maxPrice)
    }
  }

  if (prices.length === 0) return undefined

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const currency = (services.find((service) => service?.currency)?.currency || 'INR').toUpperCase()

  if (max <= min) {
    return `${currency} ${Math.round(min)}`
  }

  return `${currency} ${Math.round(min)}-${Math.round(max)}`
}

// Map category slugs to more specific schema types for richer results
function getSchemaType(categorySlug?: string): string {
  const schemaMap: Record<string, string> = {
    'photography': 'Photographer',
    'videography': 'ProfessionalService',
    'catering': 'FoodService',
    'venues': 'EventVenue',
    'entertainment': 'EntertainmentBusiness',
    'florist': 'Florist',
    'makeup-hair': 'BeautySalon',
    'wedding-planning': 'ProfessionalService',
  }
  return schemaMap[categorySlug?.toLowerCase() || ''] || 'LocalBusiness'
}

function buildJsonLd(vendor: VendorProfile, slug: string): JsonLdSchema[] {
  const extendedVendor = vendor as VendorWithSeoFields
  const canonicalUrl = `${SITE_URL}/vendors/${slug}`
  const images = collectVendorImages(extendedVendor)
  const address = extendedVendor.address
  const services = (extendedVendor.services || []).filter((service) => service?.isActive !== false)
  const categorySlug = vendor.category?.slug
  const schemaType = getSchemaType(categorySlug)

  // Main LocalBusiness schema with specific type
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${canonicalUrl}#business`,
    name: vendor.businessName,
    description: truncate(stripHtml(vendor.description) || stripHtml(vendor.tagline), 500),
    url: canonicalUrl,
    ...(images.length > 0 && { image: images }),
    ...(vendor.contactPhone && { telephone: vendor.contactPhone }),
    ...(vendor.contactEmail && { email: vendor.contactEmail }),
    ...(vendor.website && { sameAs: [vendor.website] }),
    ...(vendor.verifiedAt && {
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Verification',
        name: 'Verified Vendor on Omnicassion',
      }
    }),
    ...(computePriceRange(extendedVendor) && { priceRange: computePriceRange(extendedVendor) }),
    // Add aggregate rating
    ...(typeof vendor.averageRating === 'number' && (vendor.reviewsCount || 0) > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(vendor.averageRating.toFixed(1)),
        reviewCount: vendor.reviewsCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    // Add address with geo coordinates if available
    ...(address && (address.street || address.addressLine1 || address.city) && {
      address: {
        '@type': 'PostalAddress',
        ...(address.street || address.addressLine1
          ? { streetAddress: address.street || address.addressLine1 }
          : {}),
        ...(address.city && { addressLocality: address.city }),
        ...(address.state && { addressRegion: address.state }),
        ...(address.postalCode && { postalCode: address.postalCode }),
        addressCountry: address.country || 'IN',
      },
      areaServed: {
        '@type': 'City',
        name: address.city || 'India',
      },
    }),
    // Add services as offers
    ...(services.length > 0 && {
      makesOffer: services.slice(0, 6).map((service) => ({
        '@type': 'Offer',
        ...(service.name && { name: service.name }),
        ...(typeof service.startingPrice === 'number' && service.startingPrice > 0
          ? { price: service.startingPrice }
          : {}),
        ...(service.currency ? { priceCurrency: service.currency.toUpperCase() } : { priceCurrency: 'INR' }),
        availability: 'https://schema.org/InStock',
        url: canonicalUrl,
        seller: {
          '@type': 'Organization',
          name: vendor.businessName,
        },
      })),
    }),
    // Additional properties for better ranking
    knowsAbout: vendor.category?.name ? [vendor.category.name, 'Wedding Services', 'Event Planning'] : ['Event Services'],
    slogan: vendor.tagline || undefined,
  }

  // Breadcrumb schema with category
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Vendors',
        item: `${SITE_URL}/vendors`,
      },
      ...(vendor.category?.slug ? [{
        '@type': 'ListItem',
        position: 3,
        name: vendor.category.name,
        item: `${SITE_URL}/vendors/category/${vendor.category.slug}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: vendor.category?.slug ? 4 : 3,
        name: vendor.businessName,
        item: canonicalUrl,
      },
    ],
  }

  // Service schema for individual services
  const serviceSchemas = services.slice(0, 3).map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    provider: {
      '@type': schemaType,
      name: vendor.businessName,
      url: canonicalUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    ...(typeof service.startingPrice === 'number' && service.startingPrice > 0 && {
      offers: {
        '@type': 'Offer',
        price: service.startingPrice,
        priceCurrency: service.currency?.toUpperCase() || 'INR',
        availability: 'https://schema.org/InStock',
      },
    }),
    serviceType: vendor.category?.name || 'Event Services',
  }))

  // WebPage schema for additional context
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${vendor.businessName} - ${vendor.category?.name || 'Event Vendor'}`,
    description: truncate(stripHtml(vendor.description) || stripHtml(vendor.tagline), 300) || `${vendor.businessName} on Omnicassion`,
    url: canonicalUrl,
    mainEntity: {
      '@id': `${canonicalUrl}#business`,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Omnicassion',
      url: SITE_URL,
    },
    ...(images.length > 0 && { primaryImageOfPage: images[0] }),
  }

  return [localBusinessSchema, breadcrumbSchema, webPageSchema, ...serviceSchemas] as JsonLdSchema[]
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug
  const vendor = await getVendorBySlug(slug)
  const canonicalPath = `/vendors/${slug}`

  // Real 404 status instead of a 200 page marked noindex (Google reports those as "soft 404").
  if (!vendor) notFound()

  const vendorCity = (vendor as VendorWithSeoFields).address?.city
  const title = vendor.category?.name
    ? `${vendor.businessName}${vendorCity ? `, ${vendorCity}` : ''} – ${vendor.category.name} | Photos, Prices & Reviews`
    : `${vendor.businessName}${vendorCity ? `, ${vendorCity}` : ''} | Event Services, Photos & Reviews`

  const description = buildDescription(vendor)
  const extendedVendor = vendor as VendorWithSeoFields
  const images = collectVendorImages(extendedVendor)
  const image = images[0] || undefined

  return pageMetadata(title, description, {
    path: canonicalPath,
    image,
    keywords: buildKeywords(vendor),
    type: 'profile',
  })
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug

  // /vendors/The-Oberoi-Spa-Resort and /vendors/the-oberoi-spa-resort must be one URL (duplicate-content fix).
  if (slug && slug !== slug.toLowerCase()) {
    permanentRedirect(`/vendors/${slug.toLowerCase()}`)
  }

  const vendor = await getVendorBySlug(slug)
  // A vendor that genuinely does not exist is a real 404 (not a 200 page saying "not found").
  if (!vendor) notFound()

  const jsonLd = generateJsonLd(buildJsonLd(vendor, slug))

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <VendorPageClient slug={slug} initialVendor={vendor} />
    </>
  )
}
