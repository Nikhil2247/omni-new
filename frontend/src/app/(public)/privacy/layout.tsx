import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/common/JsonLd'
import type { JsonLdSchema } from '@/lib/seo/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

export const metadata: Metadata = pageMetadata(
  'Privacy Policy | Omnicassion',
  'Learn how Omnicassion collects, uses, and protects your personal information. Read our complete privacy policy covering data storage, security, and your rights.',
  {
    path: '/privacy',
    keywords: [
      'Omnicassion privacy policy',
      'data protection India',
      'privacy terms',
      'user data protection',
      'DPDP compliance',
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
      name: 'Privacy Policy',
      item: `${SITE_URL}/privacy`,
    },
  ],
}

export default function PrivacyLayout({
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
