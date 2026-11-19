import { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import type { JsonLdSchema } from "@/lib/seo/types";
import { toolKeywords } from "@/lib/seo/keywords";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://omnicassion.com";

export const metadata: Metadata = pageMetadata(
  "Free Digital Wedding Invitation Maker - E-Invite Generator | Omnicassion",
  "Create beautiful Indian wedding e-invitations in minutes. WhatsApp-ready templates, video invites, customizable designs. Share instantly via WhatsApp, email, or social media. 100% free.",
  {
    path: "/digital-invite-generator",
    keywords: toolKeywords['digital-invite-generator'],
  }
);

const softwareAppSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Omnicassion Digital Invite Generator",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description: "Free digital wedding invitation maker to create beautiful e-invites for Indian weddings.",
  featureList: [
    "100+ beautiful templates",
    "WhatsApp-ready format",
    "Video invitation support",
    "Custom fonts and colors",
    "Instant sharing",
  ],
  author: {
    "@type": "Organization",
    name: "Omnicassion",
    url: SITE_URL,
  },
};

const breadcrumbSchema: JsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Digital Invite Generator",
      item: `${SITE_URL}/digital-invite-generator`,
    },
  ],
};

const faqs = [
  {
    q: 'What is a digital wedding invitation?',
    a: 'A digital (electronic) wedding invitation is an invitation you design and send online instead of printing it. Guests receive a link or image they can open on their phone, so it can be shared in minutes on WhatsApp, by email or on social media.',
  },
  {
    q: 'How do I make a digital wedding invitation?',
    a: 'Choose a design, add the couple\'s names, the date, the venue and the details of each event, preview how it looks, then share the invitation link with your guests.',
  },
  {
    q: 'Can I send the invitation on WhatsApp?',
    a: 'Yes. The invitation is made to be shared as a link, so you can send it to individual guests or to family and friend groups on WhatsApp, and also by email or on social media.',
  },
  {
    q: 'How can I keep track of who is coming?',
    a: 'Use the RSVP manager together with your invitation to collect replies, and the guest list planner to keep every family and head count organised in one place.',
  },
];

const faqSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function DigitalInviteGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[softwareAppSchema, breadcrumbSchema, faqSchema]} />
      {children}

      {/* Readable, indexable guidance under the tool: this is what search engines use to understand the page. */}
      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
        <h2 className="font-display text-2xl font-semibold">How to make a digital wedding invitation</h2>
        <ol className="list-decimal space-y-2 pl-5 text-ink-soft">
          <li>Pick a design that suits your wedding and your families.</li>
          <li>Add the couple&apos;s names, the date, the venue and the details of every event.</li>
          <li>Preview the invitation, then share the link on WhatsApp, by email or on social media.</li>
          <li>Collect replies with the RSVP manager and plan seating with the guest list tool.</li>
        </ol>

        <h2 className="font-display text-2xl font-semibold">Digital wedding invitation FAQs</h2>
        <div className="divide-y rounded-lg border">
          {faqs.map((faq) => (
            <details key={faq.q} className="p-4">
              <summary className="cursor-pointer list-none font-medium">{faq.q}</summary>
              <p className="mt-2 text-sm text-ink-soft">{faq.a}</p>
            </details>
          ))}
        </div>

        <p className="text-sm text-ink-soft">
          Planning the rest of your wedding? Try the{' '}
          <Link href="/rsvp-manager" className="text-blue underline">RSVP manager</Link>,{' '}
          <Link href="/wedding-guest-list" className="text-blue underline">wedding guest list planner</Link> and{' '}
          <Link href="/event-timeline-generator" className="text-blue underline">event timeline generator</Link>.
        </p>
      </section>
    </>
  );
}
