import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { ChevronRight, MapPin, Star, Users } from 'lucide-react'
import { publicService } from '@/lib/api/services/public.service'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { JsonLd } from '@/components/common/JsonLd'
import { Button } from '@/components/ui/button'
import { pageMetadata } from '@/lib/seo/metadata'
import { findLandingPage, getLandingPages, pluralizeCategory } from '@/lib/seo/landing'
import { NotFoundError, withRetry } from '@/lib/seo/server-api'
import type { VendorProfile } from '@/lib/api/types/vendor.types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

// Built on demand, then cached and refreshed hourly (fast for crawlers, light on the rate-limited API).
export const revalidate = 3600
export const dynamicParams = true
export async function generateStaticParams() {
  return []
}

type Params = { slug: string; city: string }

/**
 * Real vendors for this category in this city. Transient API errors are retried and then thrown, so a hiccup
 * can never produce an empty page that gets indexed.
 */
const getVendors = cache(async (categorySlug: string, cityId: string): Promise<VendorProfile[]> => {
  try {
    const response = await withRetry(() =>
      publicService.getVendors({ categoryId: categorySlug, cityId, limit: 24 }),
    )
    return response?.data ?? []
  } catch (error) {
    if (error instanceof NotFoundError) return []
    throw error
  }
})

function ratingSummary(vendors: VendorProfile[]) {
  const rated = vendors.filter((v) => typeof v.averageRating === 'number' && (v.reviewsCount || 0) > 0)
  const reviews = rated.reduce((sum, v) => sum + (v.reviewsCount || 0), 0)
  if (!rated.length || !reviews) return null
  const weighted = rated.reduce((sum, v) => sum + (v.averageRating as number) * (v.reviewsCount || 0), 0) / reviews
  return { average: weighted, reviews }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug: category, city } = await params
  const page = await findLandingPage(category, city)

  if (!page) {
    return pageMetadata('Page not found', 'This page could not be found.', {
      path: `/vendors/${category}/${city}`,
      noIndex: true,
    })
  }

  const plural = pluralizeCategory(page.categoryName)
  const count = page.vendorCount
  const title = `Best ${plural} in ${page.cityName} – Compare ${count} & Get Free Quotes`
  const description = `Compare ${count} ${plural.toLowerCase()} in ${page.cityName}${page.state ? `, ${page.state}` : ''}. See photos, services and reviews, then request a free quote on Omnicassion.`

  return pageMetadata(title, description, {
    path: `/vendors/${page.categorySlug}/${page.citySlug}`,
    keywords: [
      `${plural.toLowerCase()} in ${page.cityName}`,
      `best ${plural.toLowerCase()} ${page.cityName}`,
      `${page.categoryName.toLowerCase()} ${page.cityName}`,
      `${page.categoryName.toLowerCase()} near me`,
      `book ${page.categoryName.toLowerCase()} ${page.cityName}`,
    ],
    type: 'website',
  })
}

export default async function VendorCityCategoryPage({ params }: { params: Promise<Params> }) {
  const { slug: category, city } = await params

  if (category !== category.toLowerCase() || city !== city.toLowerCase()) {
    permanentRedirect(`/vendors/${category.toLowerCase()}/${city.toLowerCase()}`)
  }

  // Only (category, city) combinations that really have vendors exist. Everything else is a real 404.
  const page = await findLandingPage(category, city)
  if (!page) notFound()

  const vendors = await getVendors(page.categorySlug, page.cityId)
  const plural = pluralizeCategory(page.categoryName)
  const pluralLower = plural.toLowerCase()
  const singularLower = page.categoryName.toLowerCase()
  const rating = ratingSummary(vendors)
  const canonical = `${SITE_URL}/vendors/${page.categorySlug}/${page.citySlug}`

  const all = await getLandingPages()
  const otherCities = all.filter((p) => p.categorySlug === page.categorySlug && p.citySlug !== page.citySlug).slice(0, 10)
  const otherCategories = all.filter((p) => p.citySlug === page.citySlug && p.categorySlug !== page.categorySlug).slice(0, 8)

  const faqs = [
    {
      q: `How many ${pluralLower} are listed in ${page.cityName}?`,
      a: `${page.vendorCount} ${pluralLower} in ${page.cityName} are currently listed on Omnicassion. The list grows as new vendors join.`,
    },
    {
      q: `How do I get a quote from a ${singularLower} in ${page.cityName}?`,
      a: `Open a vendor's profile and choose Get Quote, then share your date and requirements. Vendors reply through Omnicassion, so you can compare responses in one place.`,
    },
    {
      q: `What should I compare before booking a ${singularLower}?`,
      a: `Look at the quality and variety of the portfolio, the services and pricing listed, customer reviews, and whether they are available on your date. Request quotes from two or three vendors to compare.`,
    },
  ]

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${plural} in ${page.cityName}`,
      url: canonical,
      description: `Compare ${page.vendorCount} ${pluralLower} in ${page.cityName} on Omnicassion.`,
      isPartOf: { '@type': 'WebSite', name: 'Omnicassion', url: SITE_URL },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: vendors.length,
        itemListElement: vendors.slice(0, 20).map((vendor, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}/vendors/${vendor.slug}`,
          name: vendor.businessName,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Vendors', item: `${SITE_URL}/vendors` },
        { '@type': 'ListItem', position: 3, name: plural, item: `${SITE_URL}/vendors/category/${page.categorySlug}` },
        { '@type': 'ListItem', position: 4, name: page.cityName, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ]

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Vendors', url: '/vendors' },
    { name: plural, url: `/vendors/category/${page.categorySlug}` },
    { name: page.cityName },
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={schemas} />
      <Breadcrumb items={breadcrumbItems} />

      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Best {plural} in {page.cityName}
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Compare {page.vendorCount} {pluralLower} in {page.cityName}
          {page.state ? `, ${page.state}` : ''}. Browse portfolios and photos, see what each vendor offers, and
          request a free quote, all in one place.
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-semibold text-foreground">{page.vendorCount}</span> {pluralLower} listed
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {page.cityName}
            {page.state ? `, ${page.state}` : ''}
          </span>
          {rating && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">{rating.average.toFixed(1)}</span> from {rating.reviews}{' '}
              {rating.reviews === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
      </header>

      {vendors.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}

      {page.vendorCount > vendors.length && (
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href={`/vendors?cityId=${page.cityId}&cityName=${encodeURIComponent(page.cityName)}`}>
              See all {page.vendorCount} {pluralLower} in {page.cityName}
            </Link>
          </Button>
        </div>
      )}

      <section className="space-y-4 border-t pt-8">
        <h2 className="text-2xl font-semibold">
          Questions about {pluralLower} in {page.cityName}
        </h2>
        <div className="divide-y rounded-lg border">
          {faqs.map((faq) => (
            <details key={faq.q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium">{faq.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {(otherCities.length > 0 || otherCategories.length > 0) && (
        <section className="space-y-6 border-t pt-8">
          {otherCities.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-medium">{plural} in other cities</h2>
              <div className="flex flex-wrap gap-2">
                {otherCities.map((p) => (
                  <Link
                    key={p.citySlug}
                    href={`/vendors/${p.categorySlug}/${p.citySlug}`}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    {plural} in {p.cityName}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {otherCategories.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-medium">Other services in {page.cityName}</h2>
              <div className="flex flex-wrap gap-2">
                {otherCategories.map((p) => (
                  <Link
                    key={p.categorySlug}
                    href={`/vendors/${p.categorySlug}/${p.citySlug}`}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    {pluralizeCategory(p.categoryName)} in {p.cityName}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
