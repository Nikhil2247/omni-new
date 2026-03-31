import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/common/JsonLd'
import type { JsonLdSchema } from '@/lib/seo/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

export const metadata: Metadata = pageMetadata(
  'Terms of Service | Omnicassion',
  'Read the terms and conditions governing your use of the Omnicassion platform. Understand your rights and responsibilities as a user or vendor.',
  {
    path: '/terms',
    keywords: [
      'Omnicassion terms of service',
      'terms and conditions',
      'user agreement',
      'vendor terms',
      'platform rules',
    ],
    type: 'website',
  }
)

const breadcrumbSchema: JsonLdSchema = {
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
      name: 'Terms of Service',
      item: `${SITE_URL}/terms`,
    },
  ],
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  )
}
