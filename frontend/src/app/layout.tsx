import type { Metadata, Viewport } from "next";
import { Fraunces, Caveat, Karla } from "next/font/google";
import "./globals.css";
import { SketchFilters } from "@/components/sketch/filters";
import { Providers } from "@/providers";
import { generateMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import { createOrganizationSchema, createWebsiteSchema } from "@/lib/seo/structured-data";
import { ErrorBoundaryWrapper } from "@/components/common/error-boundary";
import { EmailVerificationWrapper } from "@/components/common/email-verification-wrapper";

// Brand typography for the hand-painted theme: Karla for text, Fraunces for headings, Caveat for handwritten accents.
const body = Karla({
  subsets: ["latin"],
  variable: "--nf-body",
  weight: ["400", "500", "700"],
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--nf-display",
  axes: ["opsz"],
  display: "swap",
});

// Italic is used by a single testimonial quote far below the fold, so it is not preloaded (saves ~70 KB on the critical path).
const displayItalic = Fraunces({
  subsets: ["latin"],
  variable: "--nf-display-italic",
  style: ["italic"],
  axes: ["opsz"],
  display: "swap",
  preload: false,
});

const hand = Caveat({
  subsets: ["latin"],
  variable: "--nf-hand",
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = generateMetadata({
  title: "Omnicassion - Wedding & Event Planning Platform in India | Book Vendors",
  description:
    "Plan your Indian wedding or event with Omnicassion. Compare venues, photographers, caterers, decorators, planners & makeup artists, get free quotes, and use free tools: budget calculator, guest list, e-invites.",
  keywords: [
    // Primary Brand Keywords
    "omnicassion",
    "omnicassion India",
    "omnicassion wedding platform",

    // High Intent Wedding Keywords
    "wedding planning India",
    "wedding vendors India",
    "book wedding vendors",
    "wedding vendors near me",
    "best wedding vendors",
    "verified wedding vendors",
    "wedding vendor marketplace",

    // Category Keywords
    "wedding photographers India",
    "wedding venues near me",
    "wedding caterers India",
    "wedding decorators",
    "bridal makeup artists India",
    "mehndi artists near me",
    "wedding planners India",
    "wedding DJs India",
    "wedding videographers",
    "wedding florists",

    // Location Keywords
    "wedding vendors Mumbai",
    "wedding vendors Delhi",
    "wedding vendors Bangalore",
    "wedding photographers Mumbai",
    "wedding venues Delhi",
    "wedding planners Bangalore",
    "destination wedding India",
    "destination wedding Goa",
    "destination wedding Udaipur",

    // Event Types
    "Indian wedding planning",
    "Hindu wedding vendors",
    "Muslim wedding vendors",
    "Christian wedding India",
    "Sikh wedding planners",
    "South Indian wedding",
    "North Indian wedding",
    "engagement party vendors",
    "sangeet event planners",
    "mehndi ceremony vendors",
    "reception planning",

    // Tools & Features
    "wedding budget calculator",
    "wedding checklist India",
    "wedding guest list manager",
    "wedding timeline planner",
    "RSVP manager online",
    "digital wedding invitations",
    "e-invite maker free",

    // Long-tail & Questions
    "how to plan Indian wedding",
    "wedding planning checklist India",
    "average wedding cost India",
    "best wedding vendors with reviews",
    "compare wedding vendor prices",
    "affordable wedding vendors",

    // Event Planning
    "event planning India",
    "event management platform",
    "corporate event vendors",
    "birthday party planners",
    "anniversary celebration vendors",
    "party planning services India",
  ],
  canonical: process.env.NEXT_PUBLIC_APP_URL || "https://omnicassion.com",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#10173a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <JsonLd data={[createOrganizationSchema(), createWebsiteSchema()]} />

        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* Umami self-hosted server – swap with your actual server URL */}
        {process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && (
          <link
            rel="dns-prefetch"
            href={new URL(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL).origin}
          />
        )}
      </head>
      <body className={`${body.variable} ${display.variable} ${displayItalic.variable} ${hand.variable} font-sans antialiased`}>
        <SketchFilters />
        <ErrorBoundaryWrapper>
          <Providers>
            <EmailVerificationWrapper />
            {children}
          </Providers>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
