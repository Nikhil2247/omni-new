import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { generateMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/common/JsonLd";
import { createOrganizationSchema, createWebsiteSchema } from "@/lib/seo/structured-data";
import { ErrorBoundaryWrapper } from "@/components/common/error-boundary";

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
  title: "Omnicassion - India's Premier Event Planning Platform",
  description: "Plan your perfect wedding, corporate event, party, or celebration with Omnicassion. Discover 10,000+ verified vendors, get instant quotes, compare prices, and book with confidence. India's most efficient, visual-first event planning ecosystem.",
  keywords: [
    "event planning India",
    "wedding planning",
    "vendor booking",
    "event management platform",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        
        {/* Unregister any existing service workers to clear cache issues */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                    console.log('Service Worker unregistered');
                  }
                });
                // Clear all caches
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (let name of names) {
                      caches.delete(name);
                      console.log('Cache deleted:', name);
                    }
                  });
                }
              }
            `,
          }}
        />
        <script src="https://cdn.jsdelivr.net/gh/sukeerat/jsdeliver-accessibilty@main/dist-cdn/accessibility-widget.min.js"></script>
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ErrorBoundaryWrapper>
          <Providers>{children}</Providers>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
