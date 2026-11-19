import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { JsonLd } from '@/components/common/JsonLd'
import { pageMetadata } from '@/lib/seo/metadata'
import { getLandingPages, getVendorPage, pluralizeCategory } from '@/lib/seo/landing'
import VendorsClient from './vendors-client'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

// One cached render per hour: stable, fast HTML for crawlers, and the rate-limited API is not hit per request.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await getVendorPage(undefined, 1)
  return pageMetadata(
    `Wedding & Event Vendors in India – Browse ${total} Photographers, Venues & More`,
    `Browse ${total} wedding and event vendors in India: photographers, venues, caterers, decorators, makeup artists and more. Compare portfolios, read reviews and request free quotes on Omnicassion.`,
    {
      path: '/vendors',
      keywords: [
        'wedding vendors India',
        'wedding vendors near me',
        'book wedding vendors online',
        'wedding photographers',
        'wedding venues',
        'wedding caterers',
        'wedding decorators',
        'bridal makeup artists',
      ],
      type: 'website',
    },
  )
}

export default async function VendorsPage() {
  const [{ vendors, total }, landing] = await Promise.all([getVendorPage(undefined, 12), getLandingPages()])

  // Categories and cities that really have vendors, with real counts.
  const categories = new Map<string, { slug: string; name: string; count: number }>()
  const cities = new Map<string, { slug: string; name: string; count: number }>()
  for (const p of landing) {
    const c = categories.get(p.categorySlug) ?? { slug: p.categorySlug, name: p.categoryName, count: 0 }
    c.count += p.vendorCount
    categories.set(p.categorySlug, c)
    const city = cities.get(p.citySlug) ?? { slug: p.citySlug, name: p.cityName, count: 0 }
    city.count += p.vendorCount
    cities.set(p.citySlug, city)
  }
  const topCategories = Array.from(categories.values()).sort((a, b) => b.count - a.count)
  const topCities = Array.from(cities.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 16)

  const faqs = [
    {
      q: 'How do I find a wedding vendor on Omnicassion?',
      a: 'Search by name or browse by category and city. Open a vendor to see their portfolio, services and reviews.',
    },
    {
      q: 'Is it free to browse vendors?',
      a: 'Yes. Browsing vendor profiles, portfolios and reviews is free.',
    },
    {
      q: 'How do I request a quote?',
      a: 'Open a vendor profile and choose Get Quote, then share your date and requirements. The vendor replies through Omnicassion so you can compare responses in one place.',
    },
  ]

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Wedding & Event Vendors in India',
      url: `${SITE_URL}/vendors`,
      isPartOf: { '@type': 'WebSite', name: 'Omnicassion', url: SITE_URL },
      inLanguage: 'en-IN',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: total,
        itemListElement: vendors.map((vendor, index) => ({
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

  const shell = (
    <main className="min-h-screen">
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-1 md:pt-7">
        <p className="sk-eyebrow">Vendors</p>
        <h1 className="font-display mt-2.5 max-w-[20ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          Find wedding and event vendors in India
        </h1>
        <p className="text-ink-soft mt-3 max-w-2xl">
          Browse {total} vendors, from photographers and venues to caterers, decorators and makeup artists. Compare
          portfolios and reviews, then request a free quote.
        </p>
      </section>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </div>
    </main>
  )

  return (
    <>
      <JsonLd data={schemas} />
      <VendorsClient shell={shell} />

      {/* Crawlable hub: real category and city landing pages with real counts. Also useful to people. */}
      <section className="mx-auto w-full max-w-[1440px] space-y-8 border-t px-4 py-10">
        {topCategories.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Browse vendors by category</h2>
            <div className="flex flex-wrap gap-2">
              {topCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/vendors/category/${c.slug}`}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
                >
                  {pluralizeCategory(c.name)} ({c.count})
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {topCities.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Popular cities</h2>
            <div className="flex flex-wrap gap-2">
              {topCities.map((city) => {
                const best = landing
                  .filter((p) => p.citySlug === city.slug)
                  .sort((a, b) => b.vendorCount - a.vendorCount)[0]
                return (
                  <Link
                    key={city.slug}
                    href={`/vendors/${best.categorySlug}/${city.slug}`}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    {pluralizeCategory(best.categoryName)} in {city.name}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-4 text-2xl font-semibold">Common questions</h2>
          <div className="divide-y rounded-lg border">
            {faqs.map((faq) => (
              <details key={faq.q} className="p-4">
                <summary className="cursor-pointer list-none font-medium">{faq.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
