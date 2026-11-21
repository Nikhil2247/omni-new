import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import type { JsonLdSchema } from "@/lib/seo/types";
import { toolKeywords } from "@/lib/seo/keywords";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://omnicassion.com";

export const metadata: Metadata = pageMetadata(
  "Free Wedding Guest List Manager - RSVP Tracking & Seating | Omnicassion",
  "Organize your Indian wedding guest list effortlessly. Track RSVPs, manage dietary preferences (veg/non-veg), create seating arrangements, and send digital invites.",
  {
    path: "/wedding-guest-list",
    keywords: toolKeywords['wedding-guest-list'],
  }
);

const softwareAppSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Omnicassion Wedding Guest List Manager",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description: "Free wedding guest list manager to organize guests, track RSVPs, and manage seating arrangements.",
  featureList: [
    "Guest list organization",
    "RSVP tracking",
    "Dietary preference management",
    "Seating chart creation",
    "Export to Excel/PDF",
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
      name: "Wedding Guest List Manager",
      item: `${SITE_URL}/wedding-guest-list`,
    },
  ],
};

export default function WeddingGuestListManagerLayout({
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
