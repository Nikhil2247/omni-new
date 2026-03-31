import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/common/JsonLd'
import type { JsonLdSchema } from '@/lib/seo/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

export const metadata: Metadata = pageMetadata(
  'Help Center & Support | Omnicassion',
  'Get help with your Omnicassion account, vendor bookings, event planning, and payments. Find answers to frequently asked questions and contact our support team.',
  {
    path: '/support',
    keywords: [
      'Omnicassion support',
      'Omnicassion help',
      'wedding planning help',
      'vendor booking support',
      'event planning FAQ',
      'Omnicassion contact',
      'account help',
      'booking issues',
    ],
    type: 'website',
  }
)

// FAQ Schema for rich results
const faqSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I reset my password?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Go to the login page and click 'Forgot Password'. Enter your registered email address and we'll send you a reset link. The link is valid for 30 minutes.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I update my profile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Log in and navigate to Settings → Profile. You can update your name, contact details, profile photo, and preferences from there.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I delete my account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Go to Settings → Account → Delete Account. Account deletion is permanent and cannot be undone. Your data will be removed within 30 days as per our Privacy Policy.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I book a vendor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Browse vendors on the Discover page or search for a specific category. Open a vendor's profile, review their portfolio and pricing, then click 'Request Quote' or 'Book Now' to initiate contact.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel a booking?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Cancellation policies vary by vendor and are displayed on their listing. Go to My Events → select the booking → Cancel Booking. Refund eligibility will be shown based on the vendor's policy.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I list my business on Omnicassion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Visit our For Vendors page and click 'Get Started'. Complete your business profile, upload portfolio images, set your service categories and pricing, and submit for review. Approval typically takes 1-3 business days.",
      },
    },
    {
      '@type': 'Question',
      name: 'When do I receive payments as a vendor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Payments are released after successful event completion as confirmed by both parties. Standard payout is within 3-5 business days post-confirmation.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I request a refund?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Refunds are subject to the vendor's cancellation policy. If you are eligible, request a refund through My Events → select the booking → Request Refund. For disputes, contact us at support@omnicassion.com.",
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods are supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We support UPI, credit/debit cards (Visa, Mastercard, RuPay), net banking, and select wallet options. All payments are processed securely through our payment partners.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I find my invoice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Invoices are available under Settings → Billing → Invoices. You can download PDF versions for any completed transaction.',
      },
    },
  ],
}

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
      name: 'Support',
      item: `${SITE_URL}/support`,
    },
  ],
}

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
