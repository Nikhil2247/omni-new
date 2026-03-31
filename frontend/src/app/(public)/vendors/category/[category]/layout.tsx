import type { Metadata } from 'next'
import { pageMetadata, generateJsonLd } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/common/JsonLd'
import type { JsonLdSchema } from '@/lib/seo/types'
import { getMetaKeywords, getCategoryFAQs, categoryKeywords, indianCities } from '@/lib/seo/keywords'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

// Category display names and descriptions for SEO - Enhanced with more keywords
const categoryConfig: Record<string, { name: string; description: string; h1: string }> = {
  'photography': {
    name: 'Wedding Photographers',
    h1: 'Best Wedding Photographers in India',
    description: 'Find & book the best wedding photographers in India. Browse portfolios, compare candid photography prices, read verified reviews. Pre-wedding photoshoot packages starting ₹25,000. Book professional photographers for your special day on Omnicassion.',
  },
  'videography': {
    name: 'Wedding Videographers',
    h1: 'Top Wedding Videographers & Cinematographers',
    description: 'Hire top wedding videographers and cinematographers in India. Cinematic wedding films, drone videography, same-day edits & highlight reels. Compare packages and book professional videographers on Omnicassion.',
  },
  'catering': {
    name: 'Catering Services',
    h1: 'Best Wedding Caterers & Catering Services',
    description: 'Book premium wedding catering services in India. Multi-cuisine menus, live food counters, vegetarian & non-veg options. Compare caterer prices per plate and book trusted caterers on Omnicassion.',
  },
  'venues': {
    name: 'Wedding Venues',
    h1: 'Best Wedding Venues & Banquet Halls',
    description: 'Discover stunning wedding venues in India. Banquet halls, farmhouses, destination wedding resorts, outdoor venues. Compare prices, capacity & amenities. Book your perfect wedding venue on Omnicassion.',
  },
  'entertainment': {
    name: 'Entertainment Services',
    h1: 'Wedding DJs, Bands & Entertainment Artists',
    description: 'Book wedding DJs, live bands, anchors & entertainment artists in India. Sangeet choreographers, dhol players, photo booths. Make your celebration memorable with top performers from Omnicassion.',
  },
  'decor-design': {
    name: 'Decor & Design',
    h1: 'Best Wedding Decorators & Event Decor',
    description: 'Transform your venue with stunning wedding decoration. Stage decor, mandap decoration, floral arrangements, theme weddings. Compare prices and book top wedding decorators in India on Omnicassion.',
  },
  'florist': {
    name: 'Florists',
    h1: 'Wedding Florists & Flower Decorators',
    description: 'Find expert wedding florists in India. Bridal bouquets, floral mandap decoration, venue flowers, car decoration. Fresh & imported flowers. Book professional florists on Omnicassion.',
  },
  'makeup-hair': {
    name: 'Makeup & Hair Artists',
    h1: 'Best Bridal Makeup Artists & Hair Stylists',
    description: 'Book professional bridal makeup artists in India. HD makeup, airbrush bridal makeup, engagement & reception looks. Compare prices, read reviews and book top makeup artists on Omnicassion.',
  },
  'mehndi-artists': {
    name: 'Mehndi Artists',
    h1: 'Best Mehndi Artists & Henna Designers',
    description: 'Discover talented mehndi artists for bridal mehndi in India. Arabic, Rajasthani, traditional & modern designs. Compare mehndi artist prices and book skilled henna artists on Omnicassion.',
  },
  'wedding-planning': {
    name: 'Wedding Planners',
    h1: 'Best Wedding Planners & Event Coordinators',
    description: 'Hire expert wedding planners in India. Full-service planning, day-of coordination, destination wedding specialists. Compare packages and book professional wedding planners on Omnicassion.',
  },
  'invitation': {
    name: 'Invitation Designers',
    h1: 'Wedding Invitation & Card Designers',
    description: 'Create stunning wedding invitations in India. Digital e-invites, printed cards, video invitations, luxury box cards. Compare designers and order custom wedding invitations on Omnicassion.',
  },
  'jewellery': {
    name: 'Bridal Jewellery',
    h1: 'Bridal Jewellery & Jewellery Rental',
    description: 'Explore bridal jewellery collections in India. Kundan, polki, temple jewellery, rental services. Gold, diamond & artificial bridal sets. Shop or rent bridal jewellery on Omnicassion.',
  },
}

function getCategoryInfo(slug: string) {
  const normalized = slug.toLowerCase().replace(/\s+/g, '-')
  const config = categoryConfig[normalized]
  const keywords = getMetaKeywords(normalized)

  if (config) {
    return {
      ...config,
      keywords,
    }
  }

  // Fallback for unknown categories
  const displayName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    name: displayName,
    h1: `Best ${displayName} in India`,
    description: `Find the best ${slug.replace(/-/g, ' ')} vendors and services in India on Omnicassion. Compare prices, read verified reviews, and book with confidence.`,
    keywords: [
      `${slug.replace(/-/g, ' ')} India`,
      `best ${slug.replace(/-/g, ' ')}`,
      `${slug.replace(/-/g, ' ')} services`,
      `${slug.replace(/-/g, ' ')} near me`,
      `top ${slug.replace(/-/g, ' ')}`,
      'wedding vendors India',
      'event services',
      'book online',
    ],
  }
}

function buildCategorySchema(category: string, categoryInfo: ReturnType<typeof getCategoryInfo>): Record<string, unknown>[] {
  const canonicalUrl = `${SITE_URL}/vendors/category/${category}`
  const faqs = getCategoryFAQs(category)

  // CollectionPage with ItemList for vendor listings
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryInfo.name} in India | Omnicassion`,
    description: categoryInfo.description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: categoryInfo.name,
      description: `List of top ${categoryInfo.name.toLowerCase()} on Omnicassion`,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: '500+',
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Omnicassion',
      url: SITE_URL,
    },
    about: {
      '@type': 'Service',
      name: categoryInfo.name,
      serviceType: 'Wedding & Event Services',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
    },
    keywords: categoryInfo.keywords.join(', '),
  }

  // Breadcrumb navigation
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
        name: categoryInfo.name,
        item: canonicalUrl,
      },
    ],
  }

  // Service schema for the category
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${categoryInfo.name} Services in India`,
    description: categoryInfo.description,
    provider: {
      '@type': 'Organization',
      name: 'Omnicassion',
      url: SITE_URL,
    },
    areaServed: indianCities.slice(0, 10).map(city => ({
      '@type': 'City',
      name: city,
      containedInPlace: {
        '@type': 'Country',
        name: 'India',
      },
    })),
    serviceType: categoryInfo.name,
    category: 'Wedding & Event Services',
  }

  const schemas: Record<string, unknown>[] = [collectionPageSchema, breadcrumbSchema, serviceSchema]

  // Add FAQ schema if FAQs exist
  if (faqs.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }
    schemas.push(faqSchema)
  }

  return schemas
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const categoryInfo = getCategoryInfo(category)
  const canonicalPath = `/vendors/category/${category}`

  return pageMetadata(
    `Best ${categoryInfo.name} in India - Compare & Book | Omnicassion`,
    categoryInfo.description,
    {
      path: canonicalPath,
      keywords: categoryInfo.keywords,
      type: 'website',
    }
  )
}

export default async function VendorCategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const categoryInfo = getCategoryInfo(category)
  const schemas = buildCategorySchema(category, categoryInfo)

  return (
    <>
      <JsonLd data={schemas} />
      {children}
    </>
  )
}
