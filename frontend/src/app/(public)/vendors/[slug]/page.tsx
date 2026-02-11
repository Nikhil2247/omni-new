import { cache } from 'react'
import type { Metadata } from 'next'
import VendorPageClient from './vendor-page-client'
import { pageMetadata, generateJsonLd } from '@/lib/seo/metadata'
import { publicService } from '@/lib/api/services/public.service'
import type { VendorProfile } from '@/lib/api/types/vendor.types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

const getVendorBySlug = cache(async (slug: string | undefined): Promise<VendorProfile | null> => {
  if (!slug) return null
  try {
    return await publicService.getVendorBySlug(slug)
  } catch {
    return null
  }
})

function buildDescription(vendor: VendorProfile) {
  if (vendor.tagline) return vendor.tagline
  if (vendor.description) {
    return vendor.description.length > 160
      ? vendor.description.slice(0, 157) + '...'
      : vendor.description
  }
  const categoryName = vendor.category?.name ? ` for ${vendor.category.name}` : ''
  return `Discover ${vendor.businessName}${categoryName} on Omnicassion. View services, portfolios, and contact details.`
}

function buildKeywords(vendor: VendorProfile) {
  const categoryName = vendor.category?.name
  const keywords = [
    vendor.businessName,
    categoryName ? `${categoryName} vendor` : null,
    categoryName ? `${categoryName} services` : null,
    categoryName ? `best ${categoryName} near me` : null,
    'event vendors',
    'wedding vendors',
    'vendor booking India',
    'Omnicassion',
  ].filter(Boolean) as string[]

  return Array.from(new Set(keywords))
}

function buildJsonLd(vendor: VendorProfile, slug: string) {
  const address = (vendor as any).address as any
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: vendor.businessName,
    description: vendor.description || vendor.tagline || '',
    url: `${SITE_URL}/vendors/${slug}`,
    ...(vendor.profilePhotoUrl && { image: vendor.profilePhotoUrl }),
    ...(vendor.contactPhone && { telephone: vendor.contactPhone }),
    ...(vendor.contactEmail && { email: vendor.contactEmail }),
    ...(vendor.website && { sameAs: [vendor.website] }),
    ...(address && (address.addressLine1 || address.city) && {
      address: {
        '@type': 'PostalAddress',
        ...(address.addressLine1 && { streetAddress: address.addressLine1 }),
        ...(address.city && { addressLocality: address.city }),
        ...(address.state && { addressRegion: address.state }),
        ...(address.postalCode && { postalCode: address.postalCode }),
        ...(address.country && { addressCountry: address.country }),
      },
    }),
  }
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
  const image = vendor.profilePhotoUrl || undefined

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
