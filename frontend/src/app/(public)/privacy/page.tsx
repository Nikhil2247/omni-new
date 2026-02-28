import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Omnicassion',
  description: 'Learn how Omnicassion collects, uses, and protects your personal information.',
}

const sections = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: [
      {
        subtitle: 'Account Information',
        text: "When you register on Omnicassion, we collect your name, email address, phone number, and profile details. Vendors additionally provide business name, service category, location, and portfolio content.",
      },
      {
        subtitle: 'Usage Data',
        text: 'We automatically collect information about how you interact with our platform, including pages visited, features used, wishlist activity, search queries, and time spent on the platform.',
      },
      {
        subtitle: 'Device & Technical Data',
        text: 'We collect IP addresses, browser type, device identifiers, operating system, and cookies to ensure the platform functions correctly and securely.',
      },
      {
        subtitle: 'Payment Information',
        text: 'Payment details are processed by our third-party payment providers. Omnicassion does not store your full card details on our servers.',
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Information',
    content: [
      {
        subtitle: 'Platform Functionality',
        text: 'To create and manage your account, connect you with vendors, process bookings, and deliver the core features of the platform.',
      },
      {
        subtitle: 'Personalisation',
        text: 'To recommend vendors, events, and content tailored to your preferences and activity on the platform.',
      },
      {
        subtitle: 'Communications',
        text: 'To send booking confirmations, platform updates, promotional offers (with your consent), and service-related notifications.',
      },
      {
        subtitle: 'Security & Fraud Prevention',
        text: "To monitor for suspicious activity, verify identities, and protect the safety of all users on the platform.",
      },
      {
        subtitle: 'Analytics & Improvement',
        text: 'To understand how the platform is used and continuously improve features, performance, and user experience.',
      },
    ],
  },
  {
    id: 'sharing',
    title: '3. Sharing Your Information',
    content: [
      {
        subtitle: 'With Vendors',
        text: 'When you contact or book a vendor, your name, contact details, and event requirements are shared with that vendor to facilitate the service.',
      },
      {
        subtitle: 'With Service Providers',
        text: "We work with trusted third-party providers for cloud hosting, analytics, payment processing, and customer support. These partners are contractually bound to protect your data.",
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose your information when required by law, court order, or government authority, or to protect the rights and safety of Omnicassion and its users.',
      },
      {
        subtitle: 'Business Transfers',
        text: 'In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.',
      },
    ],
  },
  {
    id: 'data-storage',
    title: '4. Data Storage & Security',
    content: [
      {
        subtitle: 'Where Your Data Is Stored',
        text: 'Your data is stored on secure servers located in India. We comply with applicable Indian data protection laws including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.',
      },
      {
        subtitle: 'Security Measures',
        text: 'We use industry-standard encryption (TLS/HTTPS), access controls, and regular security audits to protect your personal information from unauthorised access or disclosure.',
      },
      {
        subtitle: 'Retention',
        text: 'We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and data at any time.',
      },
    ],
  },
  {
    id: 'your-rights',
    title: '5. Your Rights',
    content: [
      {
        subtitle: 'Access & Correction',
        text: 'You have the right to access the personal information we hold about you and to request corrections if it is inaccurate or incomplete.',
      },
      {
        subtitle: 'Deletion',
        text: "You may request the deletion of your account and associated personal data by contacting us at privacy@omnicassion.com. We will process requests within 30 days.",
      },
      {
        subtitle: 'Withdraw Consent',
        text: 'Where we rely on your consent to process data (e.g., marketing emails), you may withdraw consent at any time via account settings or by contacting us.',
      },
      {
        subtitle: 'Data Portability',
        text: 'You may request a copy of your data in a structured, machine-readable format.',
      },
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    content: [
      {
        subtitle: 'What We Use Cookies For',
        text: 'We use cookies to keep you logged in, remember your preferences, analyse platform usage, and serve relevant content. You can manage cookie preferences through your browser settings.',
      },
      {
        subtitle: 'Third-Party Cookies',
        text: 'Some cookies are set by third-party services (e.g., analytics, support chat). These are governed by the respective third parties\' privacy policies.',
      },
    ],
  },
  {
    id: 'children',
    title: '7. Children\'s Privacy',
    content: [
      {
        subtitle: null,
        text: 'Omnicassion is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has registered, we will promptly delete their information.',
      },
    ],
  },
  {
    id: 'changes',
    title: '8. Changes to This Policy',
    content: [
      {
        subtitle: null,
        text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a notice on the platform. Your continued use of Omnicassion after such changes constitutes acceptance of the updated policy.',
      },
    ],
  },
  {
    id: 'contact',
    title: '9. Contact Us',
    content: [
      {
        subtitle: null,
        text: 'For any questions, concerns, or requests related to this Privacy Policy, please contact our Data Protection Officer at privacy@omnicassion.com or write to us via our Contact page.',
      },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <section className="space-y-3">
        <Badge variant="secondary">Legal</Badge>
        <h1 className="text-4xl font-semibold">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: January 2025
        </p>
        <p className="text-muted-foreground leading-relaxed">
          At Omnicassion, your privacy is important to us. This policy explains how we collect, use, store, and
          protect your personal information when you use our platform — India&apos;s premier event planning and social
          platform.
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
