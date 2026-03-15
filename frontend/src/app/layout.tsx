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
  title: "Omnicassion - India's Premier All-in-One Planning and Social Platform",
  description:
    "Omnicassion is India's premier all-in-one planning and social platform for weddings, celebrations, and events. Discover verified professionals, compare services, manage planning, and connect socially in one unified experience.",
  keywords: [
    "all-in-one planning and social platform India",
    "India event and social planning platform",
    "event planning India",
    "wedding planning",
    "vendor booking",
    "event management platform",
    "social planning platform",
    "wedding vendors India",
    "party planning services",
    "corporate event management",
    "event marketplace",
    "wedding services",
    "venue booking India",
    "catering services",
    "wedding photographers",
    "event decorators",
    "wedding planners India",
    "event organizers",
    "budget planning",
    "guest list management",
    "event timeline",
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
