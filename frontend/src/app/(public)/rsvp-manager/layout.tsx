import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import type { JsonLdSchema } from "@/lib/seo/types";
import { toolKeywords } from "@/lib/seo/keywords";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://omnicassion.com";

export const metadata: Metadata = pageMetadata(
  "Free Wedding RSVP Manager - Track Responses Online | Omnicassion",
  "Track wedding RSVPs online for free. Collect meal preferences (veg/non-veg), plus-ones, and guest messages. Real-time tracking for Indian weddings.",
  {
    path: "/rsvp-manager",
    keywords: toolKeywords['rsvp-manager'],
  }
);

const softwareAppSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Omnicassion RSVP Manager",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description: "Free wedding RSVP manager to track guest responses, meal preferences, and attendance.",
  featureList: [
    "Real-time RSVP tracking",
    "Meal preference collection",
    "Plus-one management",
    "Automated reminders",
    "Response analytics",
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
      name: "RSVP Manager",
      item: `${SITE_URL}/rsvp-manager`,
    },
  ],
};

export default function RSVPManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[softwareAppSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}
