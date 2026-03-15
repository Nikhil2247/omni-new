import { cache } from 'react'
import type { Metadata } from 'next'
import VendorPageClient from './vendor-page-client'
import { pageMetadata, generateJsonLd } from '@/lib/seo/metadata'
import { publicService } from '@/lib/api/services/public.service'
import type { VendorProfile } from '@/lib/api/types/vendor.types'
import type { JsonLdSchema } from '@/lib/seo/types'

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

const getVendorBySlug = cache(async (slug: string | undefined): Promise<VendorProfile | null> => {
  if (!slug) return null
  try {
    return await publicService.getVendorBySlug(slug)
  } catch {
    return null
  }
})

function buildDescription(vendor: VendorProfile) {
  const ratingText =
    typeof vendor.averageRating === 'number' && (vendor.reviewsCount || 0) > 0
      ? ` Rated ${vendor.averageRating.toFixed(1)}/5 from ${vendor.reviewsCount} reviews.`
      : ''

  if (vendor.tagline) return vendor.tagline
  if (vendor.description) {
    const summary = vendor.description.length > 145
      ? vendor.description.slice(0, 142) + '...'
      : vendor.description
    return `${summary}${ratingText}`
  }
  const categoryName = vendor.category?.name ? ` for ${vendor.category.name}` : ''
  return `Discover ${vendor.businessName}${categoryName} on Omnicassion. View services, portfolios, and contact details.${ratingText}`
}

function buildKeywords(vendor: VendorProfile) {
  const extendedVendor = vendor as VendorWithSeoFields
  const city = extendedVendor.address?.city
  const state = extendedVendor.address?.state
  const categoryName = vendor.category?.name

  const keywords = [
    vendor.businessName,
    categoryName ? `${categoryName} vendor` : null,
    categoryName ? `${categoryName} services` : null,
    categoryName ? `best ${categoryName} near me` : null,
    city && categoryName ? `${categoryName} in ${city}` : null,
    city && state && categoryName ? `${categoryName} ${city} ${state}` : null,
    'event vendors',
    'wedding vendors',
    'vendor booking India',
    'Omnicassion',
  ].filter(Boolean) as string[]

  return Array.from(new Set(keywords))
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

function buildJsonLd(vendor: VendorProfile, slug: string): JsonLdSchema[] {
  const extendedVendor = vendor as VendorWithSeoFields
  const canonicalUrl = `${SITE_URL}/vendors/${slug}`
  const images = collectVendorImages(extendedVendor)
  const address = extendedVendor.address
  const services = (extendedVendor.services || []).filter((service) => service?.isActive !== false)

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${canonicalUrl}#business`,
    name: vendor.businessName,
    description: vendor.description || vendor.tagline || '',
    url: canonicalUrl,
    ...(images.length > 0 && { image: images }),
    ...(vendor.contactPhone && { telephone: vendor.contactPhone }),
    ...(vendor.contactEmail && { email: vendor.contactEmail }),
    ...(vendor.website && { sameAs: [vendor.website] }),
    ...(vendor.verifiedAt && { hasCredential: 'Verified Vendor on Omnicassion' }),
    ...(computePriceRange(extendedVendor) && { priceRange: computePriceRange(extendedVendor) }),
    ...(typeof vendor.averageRating === 'number' && (vendor.reviewsCount || 0) > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(vendor.averageRating.toFixed(1)),
        reviewCount: vendor.reviewsCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(address && (address.street || address.addressLine1 || address.city) && {
      address: {
        '@type': 'PostalAddress',
        ...(address.street || address.addressLine1
          ? { streetAddress: address.street || address.addressLine1 }
          : {}),
        ...(address.city && { addressLocality: address.city }),
        ...(address.state && { addressRegion: address.state }),
        ...(address.postalCode && { postalCode: address.postalCode }),
        ...(address.country && { addressCountry: address.country }),
      },
    }),
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
      })),
    }),
  }

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
      {
        '@type': 'ListItem',
        position: 3,
        name: vendor.businessName,
        item: canonicalUrl,
      },
    ],
  }

  return [localBusinessSchema, breadcrumbSchema] as JsonLdSchema[]
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug
  const vendor = await getVendorBySlug(slug)
  const canonicalPath = `/vendors/${slug}`

  if (!vendor) {
    return pageMetadata(
      'Vendor not found',
      'The vendor you are looking for could not be found.',
      {
        path: canonicalPath,
        noIndex: true,
      },
    )
  }

  const title = vendor.category?.name
    ? `${vendor.businessName} | ${vendor.category.name} Vendor`
    : `${vendor.businessName} | Vendor`

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
  const vendor = await getVendorBySlug(slug)

  const jsonLd = vendor ? generateJsonLd(buildJsonLd(vendor, slug)) : null

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
