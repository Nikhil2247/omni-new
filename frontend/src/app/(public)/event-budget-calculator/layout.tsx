import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import type { JsonLdSchema } from "@/lib/seo/types";
import { toolKeywords } from "@/lib/seo/keywords";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://omnicassion.com";

export const metadata: Metadata = pageMetadata(
  "Free Wedding Budget Calculator India - Track Expenses Online | Omnicassion",
  "Plan your Indian wedding budget with our free online calculator. Track expenses by category (venue, catering, photography, decor), manage vendor payments, set spending limits. Trusted by 50,000+ couples.",
  {
    path: "/event-budget-calculator",
    keywords: toolKeywords['event-budget-calculator'],
  }
);

const softwareAppSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Omnicassion Event Budget Calculator",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description: "Free online event budget calculator to track wedding and party expenses. Manage your event budget by category and stay on track.",
  featureList: [
    "Track expenses by category",
    "Set budget limits",
    "Manage payments",
    "Export budget reports",
    "Real-time calculations",
  ],
  author: {
    "@type": "Organization",
    name: "Omnicassion",
    url: SITE_URL,
  },
};

const howToSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Plan Your Event Budget",
  description: "Step-by-step guide to using the Omnicassion budget calculator to plan your wedding or event expenses.",
  totalTime: "PT10M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Set Your Total Budget",
      text: "Enter your total event budget to get started. This helps track your overall spending limit.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Add Budget Categories",
      text: "Create categories like Venue, Catering, Photography, Decoration to organize expenses.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Track Expenses",
      text: "Add individual expenses under each category with amounts and payment status.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Monitor Progress",
      text: "View your spending breakdown, remaining budget, and category-wise analysis.",
    },
  ],
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
      name: "Event Budget Calculator",
      item: `${SITE_URL}/event-budget-calculator`,
    },
  ],
};

export default function EventBudgetCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[softwareAppSchema, howToSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}
