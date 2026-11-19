import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { ChevronRight, MapPin, Users } from 'lucide-react'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { JsonLd } from '@/components/common/JsonLd'
import { Button } from '@/components/ui/button'
import { pageMetadata } from '@/lib/seo/metadata'
import {
  CATEGORY_SLUG_ALIASES,
  findCategory,
  getLandingPages,
  getVendorPage,
  pluralizeCategory,
} from '@/lib/seo/landing'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

// Rendered on demand, cached, and refreshed hourly: fast stable HTML for crawlers, light load on the rate-limited API.
export const revalidate = 3600
export const dynamicParams = true
export async function generateStaticParams() {
  return []
}

type Params = { category: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category: raw } = await params
  const slug = (CATEGORY_SLUG_ALIASES[raw.toLowerCase()] ?? raw).toLowerCase()
  const category = await findCategory(slug)

  if (!category) {
    return pageMetadata('Category not found', 'This category could not be found.', {
      path: `/vendors/category/${slug}`,
      noIndex: true,
    })
  }

  const { total } = await getVendorPage(category.slug, 1)
  const landing = (await getLandingPages()).filter((p) => p.categorySlug === category.slug)
  const plural = pluralizeCategory(category.name)
  const topCities = landing.slice(0, 3).map((p) => p.cityName)

  const title = `Best ${plural} in India – ${total} Listings, Photos & Free Quotes`
  const description =
    `Compare ${total} ${plural.toLowerCase()} on Omnicassion. Browse portfolios and photos, see services and reviews, ` +
    `then request a free quote.` +
    (topCities.length ? ` Find ${plural.toLowerCase()} in ${topCities.join(', ')} and more.` : '')

  return pageMetadata(title, description, {
    path: `/vendors/category/${category.slug}`,
    keywords: [
      `${plural.toLowerCase()} in India`,
      `best ${plural.toLowerCase()}`,
      `${category.name.toLowerCase()} near me`,
      `book ${category.name.toLowerCase()} online`,
      ...topCities.map((city) => `${plural.toLowerCase()} in ${city}`),
    ],
    type: 'website',
    // A category with no listings is thin content; keep it out of the index until it has some.
    noIndex: total === 0,
  })
}

export default async function VendorsByCategoryPage({ params }: { params: Promise<Params> }) {
  const { category: raw } = await params
  const requested = raw.toLowerCase()
  const alias = CATEGORY_SLUG_ALIASES[requested]
  if (alias) permanentRedirect(`/vendors/category/${alias}`)
  if (raw !== requested) permanentRedirect(`/vendors/category/${requested}`)

  // Only real categories exist. Anything else is a real 404 (it used to render an unrelated vendor list).
  const category = await findCategory(requested)
  if (!category) notFound()

  const { vendors, total } = await getVendorPage(category.slug, 24)
  const plural = pluralizeCategory(category.name)
  const pluralLower = plural.toLowerCase()
  const singularLower = category.name.toLowerCase()
  const canonical = `${SITE_URL}/vendors/category/${category.slug}`

  const landing = await getLandingPages()
  const cities = landing.filter((p) => p.categorySlug === category.slug)
  const otherCategories = Array.from(
    new Map(
      landing
        .filter((p) => p.categorySlug !== category.slug)
        .map((p) => [p.categorySlug, { slug: p.categorySlug, name: p.categoryName }]),
    ).values(),
  ).slice(0, 10)

  const faqs = [
    {
      q: `How many ${pluralLower} are listed on Omnicassion?`,
      a: `${total} ${pluralLower} are currently listed${
        cities.length ? `, across ${cities.length} ${cities.length === 1 ? 'city' : 'cities'}` : ''
      }. New vendors are added regularly.`,
    },
    ...(cities.length
      ? [
          {
            q: `Which cities have ${pluralLower} on Omnicassion?`,
            a: `You can browse ${pluralLower} in ${cities
              .slice(0, 8)
              .map((p) => p.cityName)
              .join(', ')}${cities.length > 8 ? ' and more' : ''}.`,
          },
        ]
      : []),
    {
      q: `How do I get a quote from a ${singularLower}?`,
      a: `Open a vendor's profile and choose Get Quote, then share your date and requirements. Vendors reply through Omnicassion so you can compare responses in one place.`,
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
      name: `${plural} in India`,
      url: canonical,
      description: `Compare ${total} ${pluralLower} on Omnicassion.`,
      isPartOf: { '@type': 'WebSite', name: 'Omnicassion', url: SITE_URL },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: total,
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
        { '@type': 'ListItem', position: 3, name: plural, item: canonical },
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
    { name: plural },
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={schemas} />
      <Breadcrumb items={breadcrumbItems} />

      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Best {plural} in India</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Compare {total} {pluralLower} on Omnicassion. Browse portfolios and photos, see the services each vendor
          offers, and request a free quote, all in one place.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-semibold text-foreground">{total}</span> {pluralLower} listed
          </span>
          {cities.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Available in {cities.length} {cities.length === 1 ? 'city' : 'cities'}
            </span>
          )}
        </div>
      </header>

      {vendors.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-12 text-center">
          <h2 className="text-lg font-medium">No {pluralLower} listed yet</h2>
          <p className="mt-2 text-muted-foreground">We are adding new vendors regularly. Check back soon.</p>
        </div>
      )}

      {total > vendors.length && (
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/vendors">
              Browse all {total} {pluralLower}
            </Link>
          </Button>
        </div>
      )}

      {cities.length > 0 && (
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-2xl font-semibold">{plural} by city</h2>
          <div className="flex flex-wrap gap-2">
            {cities.map((p) => (
              <Link
                key={p.citySlug}
                href={`/vendors/${p.categorySlug}/${p.citySlug}`}
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
              >
                {plural} in {p.cityName} ({p.vendorCount})
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 border-t pt-8">
        <h2 className="text-2xl font-semibold">{plural}: common questions</h2>
        <div className="divide-y rounded-lg border">
          {faqs.map((faq) => (
            <details key={faq.q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium">{faq.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {otherCategories.length > 0 && (
        <section className="space-y-4 border-t pt-8">
          <h2 className="text-lg font-medium">Browse other categories</h2>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/vendors/category/${c.slug}`}
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
              >
                {pluralizeCategory(c.name)}
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
