import type { Metadata } from 'next'
import { pageMetadata, generateJsonLd } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/common/JsonLd'
import type { JsonLdSchema } from '@/lib/seo/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

export const metadata: Metadata = pageMetadata(
  'Join as a Vendor - Grow Your Event Business | Omnicassion',
  'List your wedding or event business on India\'s fastest-growing event marketplace. Get qualified leads, showcase your portfolio, and connect with couples and planners. Free to join.',
  {
    path: '/for-vendors',
    keywords: [
      'list wedding business',
      'vendor registration India',
      'event vendor platform',
      'wedding vendor leads',
      'grow event business',
      'wedding photographer leads',
      'catering business leads',
      'event planner marketplace',
      'vendor booking platform',
      'wedding industry marketplace',
      'get more wedding bookings',
      'event vendor marketing',
    ],
    type: 'website',
  }
)

function buildForVendorsSchema(): JsonLdSchema[] {
  const canonicalUrl = `${SITE_URL}/for-vendors`

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Join Omnicassion as a Vendor',
    description: 'List your wedding or event business on India\'s premier event marketplace. Get qualified leads, showcase your portfolio, and grow your business.',
    url: canonicalUrl,
    mainEntity: {
      '@type': 'Service',
      name: 'Omnicassion Vendor Platform',
      description: 'A marketplace platform for wedding and event vendors to connect with customers',
      provider: {
        '@type': 'Organization',
        name: 'Omnicassion',
        url: SITE_URL,
      },
      serviceType: 'Vendor Marketplace',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Vendor Plans',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Free Listing',
            description: 'Basic vendor profile with portfolio showcase',
            price: '0',
            priceCurrency: 'INR',
          },
          {
            '@type': 'Offer',
            name: 'Premium Listing',
            description: 'Featured placement, verified badge, and priority leads',
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'INR',
            },
          },
        ],
      },
    },
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
        name: 'For Vendors',
        item: canonicalUrl,
      },
    ],
  }

  // FAQ Schema for common vendor questions
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I list my business on Omnicassion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click "Start Growing Today" and create your vendor account. Complete your business profile, upload portfolio images, set your service categories and pricing, and submit for review. Approval typically takes 1-3 business days.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is it free to join Omnicassion as a vendor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, basic vendor listings are completely free. You can create a profile, upload unlimited portfolio images, and receive inquiries at no cost. Premium features are available for vendors who want additional visibility.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get more leads on Omnicassion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Complete your profile with high-quality photos, collect reviews from happy clients, respond quickly to inquiries, and keep your availability updated. Verified vendors with complete profiles receive significantly more leads.',
        },
      },
      {
        '@type': 'Question',
        name: 'What types of vendors can join Omnicassion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We welcome all wedding and event service providers including photographers, videographers, caterers, venues, decorators, makeup artists, mehndi artists, DJs, wedding planners, florists, invitation designers, and more.',
        },
      },
    ],
  }

  return [webPageSchema, breadcrumbSchema, faqSchema] as JsonLdSchema[]
}

export default function ForVendorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const schemas = buildForVendorsSchema()

  return (
    <>
      <JsonLd data={schemas} />
      {children}
    </>
  )
}
