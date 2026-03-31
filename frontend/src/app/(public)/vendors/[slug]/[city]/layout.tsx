import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pageMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/common/JsonLd'
import type { JsonLdSchema } from '@/lib/seo/types'
import { categoryKeywords, indianCities } from '@/lib/seo/keywords'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

// Validate city is in our list
const validCities = new Set(indianCities.map(c => c.toLowerCase().replace(/\s+/g, '-')))

// Category display configurations
const categoryDisplayConfig: Record<string, { singular: string; plural: string }> = {
  'photography': { singular: 'Wedding Photographer', plural: 'Wedding Photographers' },
  'videography': { singular: 'Wedding Videographer', plural: 'Wedding Videographers' },
  'catering': { singular: 'Caterer', plural: 'Caterers' },
  'venues': { singular: 'Wedding Venue', plural: 'Wedding Venues' },
  'entertainment': { singular: 'Wedding DJ', plural: 'Wedding DJs & Entertainment' },
  'decor-design': { singular: 'Wedding Decorator', plural: 'Wedding Decorators' },
  'florist': { singular: 'Wedding Florist', plural: 'Wedding Florists' },
  'makeup-hair': { singular: 'Bridal Makeup Artist', plural: 'Bridal Makeup Artists' },
  'mehndi-artists': { singular: 'Mehndi Artist', plural: 'Mehndi Artists' },
  'wedding-planning': { singular: 'Wedding Planner', plural: 'Wedding Planners' },
  'invitation': { singular: 'Invitation Designer', plural: 'Invitation Designers' },
  'jewellery': { singular: 'Bridal Jewellery', plural: 'Bridal Jewellery Shops' },
}

function getCityDisplayName(citySlug: string): string {
  const cityMap: Record<string, string> = {
    'mumbai': 'Mumbai',
    'delhi': 'Delhi',
    'bangalore': 'Bangalore',
    'hyderabad': 'Hyderabad',
    'chennai': 'Chennai',
    'kolkata': 'Kolkata',
    'pune': 'Pune',
    'ahmedabad': 'Ahmedabad',
    'jaipur': 'Jaipur',
    'lucknow': 'Lucknow',
    'chandigarh': 'Chandigarh',
    'goa': 'Goa',
    'udaipur': 'Udaipur',
    'kochi': 'Kochi',
    'gurgaon': 'Gurgaon',
    'noida': 'Noida',
    'indore': 'Indore',
    'surat': 'Surat',
    'nagpur': 'Nagpur',
    'coimbatore': 'Coimbatore',
  }
  return cityMap[citySlug.toLowerCase()] || citySlug.charAt(0).toUpperCase() + citySlug.slice(1)
}

function getCategoryConfig(categorySlug: string) {
  const config = categoryDisplayConfig[categorySlug]
  if (config) return config

  const displayName = categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return { singular: displayName, plural: `${displayName}s` }
}

function buildCityKeywords(categorySlug: string, city: string): string[] {
  const config = categoryKeywords[categorySlug]
  const cityName = getCityDisplayName(city)
  const categoryConfig = getCategoryConfig(categorySlug)

  const baseKeywords = config ? [
    ...config.primary.slice(0, 3),
    ...config.localVariants(cityName),
  ] : []

  return [
    ...baseKeywords,
    `${categoryConfig.plural} in ${cityName}`,
    `best ${categoryConfig.plural.toLowerCase()} ${cityName}`,
    `top ${categoryConfig.singular.toLowerCase()} ${cityName}`,
    `${categoryConfig.singular.toLowerCase()} near me ${cityName}`,
    `affordable ${categoryConfig.singular.toLowerCase()} ${cityName}`,
    `${categoryConfig.singular.toLowerCase()} prices ${cityName}`,
    `book ${categoryConfig.singular.toLowerCase()} ${cityName}`,
    `hire ${categoryConfig.singular.toLowerCase()} ${cityName}`,
    `wedding services ${cityName}`,
    `event vendors ${cityName}`,
  ].slice(0, 20)
}

function buildCitySchema(
  categorySlug: string,
  citySlug: string,
  categoryConfig: ReturnType<typeof getCategoryConfig>,
  cityName: string
): JsonLdSchema[] {
  const canonicalUrl = `${SITE_URL}/vendors/${categorySlug}/${citySlug}`

  // Service schema with specific location
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${categoryConfig.plural} in ${cityName}`,
    description: `Find and book the best ${categoryConfig.plural.toLowerCase()} in ${cityName}. Compare portfolios, read reviews, and get quotes on Omnicassion.`,
    provider: {
      '@type': 'Organization',
      name: 'Omnicassion',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'City',
      name: cityName,
      containedInPlace: {
        '@type': 'Country',
        name: 'India',
      },
    },
    serviceType: categoryConfig.plural,
    url: canonicalUrl,
  }

  // CollectionPage for listings
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryConfig.plural} in ${cityName} | Omnicassion`,
    description: `Browse ${categoryConfig.plural.toLowerCase()} in ${cityName}. Compare prices, view portfolios, read reviews.`,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: `${categoryConfig.plural} in ${cityName}`,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Omnicassion',
      url: SITE_URL,
    },
  }

  // Breadcrumb
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
        name: categoryConfig.plural,
        item: `${SITE_URL}/vendors/category/${categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: cityName,
        item: canonicalUrl,
      },
    ],
  }

  // LocalBusiness aggregation
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${categoryConfig.plural} in ${cityName}`,
    description: `Directory of ${categoryConfig.plural.toLowerCase()} serving ${cityName} and nearby areas.`,
    url: canonicalUrl,
    areaServed: cityName,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityName,
      addressCountry: 'IN',
    },
  }

  return [serviceSchema, collectionSchema, breadcrumbSchema, localBusinessSchema] as JsonLdSchema[]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; city: string }>
}): Promise<Metadata> {
  const { slug: category, city } = await params

  // Validate city
  if (!validCities.has(city.toLowerCase())) {
    return pageMetadata('Not Found', 'Page not found', { noIndex: true })
  }

  const categoryConfig = getCategoryConfig(category)
  const cityName = getCityDisplayName(city)
  const keywords = buildCityKeywords(category, city)

  const title = `Best ${categoryConfig.plural} in ${cityName} - Compare & Book | Omnicassion`
  const description = `Find top ${categoryConfig.plural.toLowerCase()} in ${cityName}. Browse portfolios, compare prices, read verified reviews. Book the best ${categoryConfig.singular.toLowerCase()} for your wedding or event on Omnicassion.`

  return pageMetadata(title, description, {
    path: `/vendors/${category}/${city}`,
    keywords,
    type: 'website',
  })
}

export default async function VendorCityCategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string; city: string }>
}) {
  const { slug: category, city } = await params

  // Validate city
  if (!validCities.has(city.toLowerCase())) {
    notFound()
  }

  const categoryConfig = getCategoryConfig(category)
  const cityName = getCityDisplayName(city)
  const schemas = buildCitySchema(category, city, categoryConfig, cityName)

  return (
    <>
      <JsonLd data={schemas} />
      {children}
    </>
  )
}
