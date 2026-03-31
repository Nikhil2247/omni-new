import { Metadata } from "next";
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

export default function DigitalInviteGeneratorLayout({
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
