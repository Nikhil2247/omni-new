import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import type { JsonLdSchema } from "@/lib/seo/types";
import { toolKeywords } from "@/lib/seo/keywords";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://omnicassion.com";

export const metadata: Metadata = pageMetadata(
  "Free Wedding Timeline Generator - Day Schedule Maker | Omnicassion",
  "Create your perfect Indian wedding day timeline. Schedule sangeet, mehndi, haldi, wedding & reception. Share with vendors, family, and coordinators. Used by 50,000+ couples.",
  {
    path: "/event-timeline-generator",
    keywords: toolKeywords['event-timeline-generator'],
  }
);

const softwareAppSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Omnicassion Wedding Timeline Generator",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description: "Free wedding timeline generator to create detailed schedules for your wedding day events.",
  featureList: [
    "Day-of timeline creation",
    "Event scheduling",
    "Vendor coordination",
    "Shareable schedules",
    "Print-ready format",
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
      name: "Event Timeline Generator",
      item: `${SITE_URL}/event-timeline-generator`,
    },
  ],
};

export default function EventTimelineGeneratorLayout({
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
