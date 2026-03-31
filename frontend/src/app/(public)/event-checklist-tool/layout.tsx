import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import type { JsonLdSchema } from "@/lib/seo/types";
import { toolKeywords } from "@/lib/seo/keywords";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://omnicassion.com";

export const metadata: Metadata = pageMetadata(
  "Free Indian Wedding Checklist - Complete Planning Guide | Omnicassion",
  "Never miss a detail with our comprehensive Indian wedding checklist. Customizable tasks for sangeet, mehndi, haldi, wedding & reception. Download free printable checklist. Used by 50,000+ couples.",
  {
    path: "/event-checklist-tool",
    keywords: toolKeywords['event-checklist-tool'],
  }
);

const softwareAppSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Omnicassion Event Checklist Tool",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description: "Free event checklist tool to organize and track all your wedding and party planning tasks.",
  featureList: [
    "Customizable task lists",
    "Deadline reminders",
    "Progress tracking",
    "Category organization",
    "Shareable checklists",
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
      name: "Event Checklist Tool",
      item: `${SITE_URL}/event-checklist-tool`,
    },
  ],
};

export default function EventChecklistToolLayout({
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
