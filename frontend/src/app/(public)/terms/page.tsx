import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Omnicassion',
  description: 'Read the terms and conditions governing your use of the Omnicassion platform.',
}

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: [
      {
        subtitle: null,
        text: "By accessing or using Omnicassion ('the Platform'), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the Platform. These terms apply to all users including guests, registered users, and vendors.",
      },
    ],
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: [
      {
        subtitle: null,
        text: 'You must be at least 18 years of age to use Omnicassion. By creating an account, you represent and warrant that you are 18 or older and have the legal capacity to enter into these terms.',
      },
    ],
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    content: [
      {
        subtitle: 'Account Responsibility',
        text: 'You are responsible for maintaining the confidentiality of your login credentials and all activity that occurs under your account. Notify us immediately at support@omnicassion.com if you suspect unauthorised access.',
      },
      {
        subtitle: 'Accurate Information',
        text: 'You agree to provide accurate, current, and complete information when registering and to keep your profile up to date.',
      },
      {
        subtitle: 'One Account Per User',
        text: 'Each person may maintain only one personal account. Vendors may maintain a separate business account. Creating multiple accounts to circumvent restrictions is prohibited.',
      },
    ],
  },
  {
    id: 'user-conduct',
    title: '4. Acceptable Use',
    content: [
      {
        subtitle: 'Prohibited Activities',
        text: 'You agree not to: post false, misleading, or defamatory content; harass, threaten, or harm other users; use the platform for fraudulent activity; scrape, crawl, or mine data without authorisation; upload malware or disrupt platform infrastructure; impersonate another person or entity.',
      },
      {
        subtitle: 'Content Standards',
        text: 'All content you post—including portfolio images, reviews, and messages—must be lawful, non-offensive, and respect intellectual property rights. We reserve the right to remove content that violates these standards.',
      },
    ],
  },
  {
    id: 'vendors',
    title: '5. Vendor Terms',
    content: [
      {
        subtitle: 'Vendor Listings',
        text: 'Vendors are responsible for the accuracy of their listings, pricing, availability, and portfolio content. Misleading listings may result in account suspension.',
      },
      {
        subtitle: 'Service Delivery',
        text: 'Vendors agree to fulfil bookings made through the platform in accordance with the details provided. Cancellations must be communicated promptly through the platform.',
      },
      {
        subtitle: 'Commission & Fees',
        text: 'Vendors are subject to a platform commission on bookings facilitated through Omnicassion. Commission rates and payment schedules are detailed in the Vendor Agreement.',
      },
      {
        subtitle: 'Verification',
        text: "Omnicassion may verify vendor identity and credentials. Vendors grant us the right to display their portfolio, reviews, and business details on the platform.",
      },
    ],
  },
  {
    id: 'payments',
    title: '6. Payments & Refunds',
    content: [
      {
        subtitle: 'Payment Processing',
        text: 'Payments are processed securely through our third-party payment partners. By making a payment, you authorise the applicable charge to your selected payment method.',
      },
      {
        subtitle: 'Refund Policy',
        text: 'Refund eligibility depends on the vendor\'s individual cancellation policy, which is displayed on their listing. Platform booking fees may be non-refundable. Contact us at support@omnicassion.com for disputes.',
      },
      {
        subtitle: 'Taxes',
        text: 'Pricing on the platform may be exclusive of GST or other applicable taxes. Final applicable taxes will be displayed at checkout.',
      },
    ],
  },
  {
    id: 'ip',
    title: '7. Intellectual Property',
    content: [
      {
        subtitle: 'Platform Content',
        text: 'All design elements, software, and original content on Omnicassion are owned by or licensed to Omnicassion and protected under Indian intellectual property laws.',
      },
      {
        subtitle: 'User Content',
        text: 'By uploading content to the platform, you grant Omnicassion a non-exclusive, royalty-free licence to use, display, and distribute that content in connection with operating the platform.',
      },
    ],
  },
  {
    id: 'disclaimer',
    title: '8. Disclaimers & Limitation of Liability',
    content: [
      {
        subtitle: 'Platform as Intermediary',
        text: "Omnicassion is a marketplace that connects users with vendors. We do not endorse any vendor and are not a party to any agreement between users and vendors.",
      },
      {
        subtitle: 'No Warranties',
        text: 'The platform is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access, accuracy of vendor listings, or the quality of vendor services.',
      },
      {
        subtitle: 'Limitation of Liability',
        text: 'To the fullest extent permitted by law, Omnicassion shall not be liable for indirect, incidental, or consequential damages arising from use of the platform.',
      },
    ],
  },
  {
    id: 'termination',
    title: '9. Termination',
    content: [
      {
        subtitle: null,
        text: 'We reserve the right to suspend or terminate your account if you violate these Terms. You may delete your account at any time via account settings. Upon termination, your right to use the platform ceases immediately.',
      },
    ],
  },
  {
    id: 'governing-law',
    title: '10. Governing Law',
    content: [
      {
        subtitle: null,
        text: "These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka. We encourage resolution through our dispute process before pursuing legal remedies.",
      },
    ],
  },
  {
    id: 'changes',
    title: '11. Changes to Terms',
    content: [
      {
        subtitle: null,
        text: 'We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms. We will notify you of material changes by email or platform notice.',
      },
    ],
  },
  {
    id: 'contact',
    title: '12. Contact',
    content: [
      {
        subtitle: null,
        text: 'For questions about these Terms, please contact us at legal@omnicassion.com or through our Contact page.',
      },
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <section className="space-y-3">
        <Badge variant="secondary">Legal</Badge>
        <h1 className="text-4xl font-semibold">Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated: January 2025
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Please read these Terms of Service carefully before using Omnicassion. These terms govern your access to
          and use of India&apos;s premier event planning and social platform.
        </p>
      </section>

      <Separator />

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-4 scroll-mt-20">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <div className="space-y-4">
            {section.content.map((item, i) => (
              <div key={i} className="space-y-1">
                {item.subtitle && (
                  <h3 className="text-sm font-medium text-foreground">{item.subtitle}</h3>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
