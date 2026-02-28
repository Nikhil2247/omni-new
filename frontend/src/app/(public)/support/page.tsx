import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support | Omnicassion',
  description: 'Get help with your Omnicassion account, bookings, and vendor listings.',
}

const categories = [
  {
    title: 'Account & Profile',
    description: 'Login issues, account settings, password reset, and profile management.',
    links: [
      { label: 'How do I reset my password?', href: '#password-reset' },
      { label: 'How do I update my profile?', href: '#update-profile' },
      { label: 'How do I delete my account?', href: '#delete-account' },
    ],
  },
  {
    title: 'Bookings & Events',
    description: 'Help with event planning, bookings, cancellations, and scheduling.',
    links: [
      { label: 'How do I book a vendor?', href: '#book-vendor' },
      { label: 'Can I cancel a booking?', href: '#cancel-booking' },
      { label: 'How do I track my event progress?', href: '#event-progress' },
    ],
  },
  {
    title: 'For Vendors',
    description: 'Listing setup, portfolio management, payments, and vendor account help.',
    links: [
      { label: 'How do I list my business?', href: '#list-business' },
      { label: 'How do I manage my portfolio?', href: '#manage-portfolio' },
      { label: 'When do I receive payments?', href: '#payments' },
    ],
  },
  {
    title: 'Billing & Payments',
    description: 'Refunds, invoices, payment methods, and subscription queries.',
    links: [
      { label: 'How do I request a refund?', href: '#refund' },
      { label: 'What payment methods are supported?', href: '#payment-methods' },
      { label: 'Where is my invoice?', href: '#invoice' },
    ],
  },
]

const faqs = [
  {
    id: 'password-reset',
    question: 'How do I reset my password?',
    answer:
      "Go to the login page and click 'Forgot Password'. Enter your registered email address and we'll send you a reset link. The link is valid for 30 minutes.",
  },
  {
    id: 'update-profile',
    question: 'How do I update my profile?',
    answer:
      'Log in and navigate to Settings → Profile. You can update your name, contact details, profile photo, and preferences from there.',
  },
  {
    id: 'delete-account',
    question: 'How do I delete my account?',
    answer:
      "Go to Settings → Account → Delete Account. Account deletion is permanent and cannot be undone. Your data will be removed within 30 days as per our Privacy Policy. If you have active bookings, please resolve them before deleting.",
  },
  {
    id: 'book-vendor',
    question: 'How do I book a vendor?',
    answer:
      "Browse vendors on the Discover page or search for a specific category. Open a vendor's profile, review their portfolio and pricing, then click 'Request Quote' or 'Book Now' to initiate contact.",
  },
  {
    id: 'cancel-booking',
    question: 'Can I cancel a booking?',
    answer:
      "Cancellation policies vary by vendor and are displayed on their listing. Go to My Events → select the booking → Cancel Booking. Refund eligibility will be shown based on the vendor's policy.",
  },
  {
    id: 'event-progress',
    question: 'How do I track my event progress?',
    answer:
      "Your event dashboard shows all tasks, vendor bookings, guest counts, and timelines in one place. Navigate to My Events and select your event to see the full planning overview.",
  },
  {
    id: 'list-business',
    question: 'How do I list my business on Omnicassion?',
    answer:
      "Visit our For Vendors page and click 'Get Started'. Complete your business profile, upload portfolio images, set your service categories and pricing, and submit for review. Approval typically takes 1–3 business days.",
  },
  {
    id: 'manage-portfolio',
    question: 'How do I manage my portfolio?',
    answer:
      'Log in to your vendor account and navigate to Portfolio. You can upload images, add captions, organise galleries, and highlight featured work. High-quality images improve your visibility in search results.',
  },
  {
    id: 'payments',
    question: 'When do I receive payments as a vendor?',
    answer:
      'Payments are released after successful event completion as confirmed by both parties. Standard payout is within 3–5 business days post-confirmation. Bank details can be added in Settings → Payouts.',
  },
  {
    id: 'refund',
    question: 'How do I request a refund?',
    answer:
      "Refunds are subject to the vendor's cancellation policy. If you are eligible, request a refund through My Events → select the booking → Request Refund. For disputes, contact us at support@omnicassion.com.",
  },
  {
    id: 'payment-methods',
    question: 'What payment methods are supported?',
    answer:
      'We support UPI, credit/debit cards (Visa, Mastercard, RuPay), net banking, and select wallet options. All payments are processed securely through our payment partners.',
  },
  {
    id: 'invoice',
    question: 'Where can I find my invoice?',
    answer:
      "Invoices are available under Settings → Billing → Invoices. You can download PDF versions for any completed transaction. For GST invoices, ensure your GSTIN is entered in your account settings.",
  },
]

export default function SupportPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      {/* Header */}
      <section className="space-y-3">
        <Badge variant="secondary">Help Center</Badge>
        <h1 className="text-4xl font-semibold">How can we help?</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions or reach out to our support team.
        </p>
      </section>

      {/* Categories */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Card key={cat.title} className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{cat.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
              <ul className="space-y-1.5">
                {cat.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator />

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              id={faq.id}
              className="rounded-xl border bg-muted/30 p-5 space-y-2 scroll-mt-20"
            >
              <h3 className="text-sm font-medium">{faq.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Contact CTA */}
      <section className="rounded-2xl border bg-muted/40 p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Still need help?</h2>
            <p className="text-sm text-muted-foreground">
              Our support team is available Monday – Saturday, 9 AM – 7 PM IST.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild>
              <a href="mailto:support@omnicassion.com">Email Support</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
