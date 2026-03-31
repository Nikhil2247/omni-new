import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { generateMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import { createOrganizationSchema, createWebsiteSchema } from "@/lib/seo/structured-data";
import { ErrorBoundaryWrapper } from "@/components/common/error-boundary";
import { EmailVerificationWrapper } from "@/components/common/email-verification-wrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = generateMetadata({
  title: "Omnicassion - India's #1 Wedding & Event Planning Platform | Book Verified Vendors",
  description:
    "Plan your dream Indian wedding with Omnicassion. Book verified photographers, venues, caterers, decorators & makeup artists. Free planning tools, budget calculator, guest list manager. Trusted by 50,000+ couples. Compare prices & read reviews.",
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
    { media: "(prefers-color-scheme: light)", color: "#ec4899" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
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

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
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
