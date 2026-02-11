import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();
  
  // Static pages with high priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/vendors`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/discover`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Auth pages
  const authRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/signin`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Vendor category pages (example categories)
  const categoryRoutes: MetadataRoute.Sitemap = [
    'venues',
    'catering',
    'photography',
    'decorators',
    'wedding-planning',
    'dj-music',
    'florists',
    'makeup-hair',
    'videography',
    'invitations',
  ].map((category) => ({
    url: `${SITE_URL}/vendors?category=${category}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Onboarding pages
  const onboardingRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/onboarding`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...staticRoutes, ...authRoutes, ...categoryRoutes, ...onboardingRoutes];
}
