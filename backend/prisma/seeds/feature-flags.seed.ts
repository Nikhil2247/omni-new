import { PrismaClient } from '@prisma/client';

// ============================================================================
// FEATURE FLAGS SEED
// ============================================================================

interface FeatureFlagDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  isSystem: boolean;
}

const featureFlags: FeatureFlagDefinition[] = [
  // ============================================================================
  // MARKETING FEATURES
  // ============================================================================
  {
    key: 'marketing.campaigns',
    name: 'Campaigns & Ads',
    description: 'Enable campaign management and advertising features',
    category: 'marketing',
    enabled: false,
    isSystem: true,
  },
  {
    key: 'marketing.banner_ads',
    name: 'Banner Ads',
    description: 'Enable banner advertisement placements',
    category: 'marketing',
    enabled: false,
    isSystem: true,
  },
  {
    key: 'marketing.promotions',
    name: 'Promotions',
    description: 'Enable promotional offers and discounts',
    category: 'marketing',
    enabled: false,
    isSystem: true,
  },
  {
    key: 'marketing.featured_vendors',
    name: 'Featured Vendors',
    description: 'Enable featured vendor listings on homepage',
    category: 'marketing',
    enabled: true,
    isSystem: true,
  },

  // ============================================================================
  // VENDOR FEATURES
  // ============================================================================
  {
    key: 'vendor.onboarding',
    name: 'Vendor Onboarding',
    description: 'Allow new vendors to register and onboard',
    category: 'vendor',
    enabled: false,
    isSystem: true,
  },
  {
    key: 'vendor.kyc',
    name: 'KYC Verification',
    description: 'Enable vendor identity verification workflow',
    category: 'vendor',
    enabled: false,
    isSystem: true,
  },
  {
    key: 'vendor.contracts',
    name: 'Contract Management',
    description: 'Enable vendor contract creation and management',
    category: 'vendor',
    enabled: false,
    isSystem: true,
  },
  {
    key: 'vendor.claiming',
    name: 'Vendor Claiming',
    description: 'Allow users to claim unclaimed vendor profiles',
    category: 'vendor',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'vendor.messaging',
    name: 'Vendor Messaging',
    description: 'Enable messaging between vendors and users',
    category: 'vendor',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'vendor.portfolio',
    name: 'Portfolio Management',
    description: 'Enable vendor portfolio and gallery features',
    category: 'vendor',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'vendor.services',
    name: 'Service Listings',
    description: 'Enable vendor service listings and pricing',
    category: 'vendor',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'vendor.calendar',
    name: 'Availability Calendar',
    description: 'Enable vendor availability calendar',
    category: 'vendor',
    enabled: true,
    isSystem: true,
  },

  // ============================================================================
  // USER FEATURES
  // ============================================================================
  {
    key: 'user.events',
    name: 'Event Planning',
    description: 'Enable event creation and planning features',
    category: 'user',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'user.wishlists',
    name: 'Wishlists',
    description: 'Enable vendor wishlists and favorites',
    category: 'user',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'user.messaging',
    name: 'User Messaging',
    description: 'Enable user-to-vendor messaging',
    category: 'user',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'user.reviews',
    name: 'Reviews',
    description: 'Enable vendor reviews and ratings',
    category: 'user',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'user.memories',
    name: 'Event Memories',
    description: 'Enable event memories and photo galleries',
    category: 'user',
    enabled: true,
    isSystem: true,
  },

  // ============================================================================
  // SYSTEM FEATURES
  // ============================================================================
  {
    key: 'system.chatbot',
    name: 'AI Chatbot',
    description: 'Enable AI-powered chatbot assistant',
    category: 'system',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'system.search',
    name: 'Global Search',
    description: 'Enable global search functionality',
    category: 'system',
    enabled: true,
    isSystem: true,
  },
  {
    key: 'system.notifications',
    name: 'Notifications',
    description: 'Enable push and in-app notifications',
    category: 'system',
    enabled: true,
    isSystem: true,
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedFeatureFlags(prisma: PrismaClient) {
  console.log('Seeding feature flags...');

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        // Only update metadata, preserve existing enabled state
        name: flag.name,
        description: flag.description,
        category: flag.category,
        isSystem: flag.isSystem,
      },
      create: {
        key: flag.key,
        name: flag.name,
        description: flag.description,
        category: flag.category,
        enabled: flag.enabled,
        isSystem: flag.isSystem,
      },
    });

    console.log(`  Upserted feature flag: ${flag.key}`);
  }

  console.log('Feature flags seeding completed!');

  // Return summary
  const allFlags = await prisma.featureFlag.findMany({
    orderBy: { key: 'asc' },
  });

  const summary = {
    total: allFlags.length,
    enabled: allFlags.filter((f) => f.enabled).length,
    disabled: allFlags.filter((f) => !f.enabled).length,
    byCategory: allFlags.reduce(
      (acc, flag) => {
        const category = flag.category || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  console.log(`  Summary: ${summary.total} flags (${summary.enabled} enabled, ${summary.disabled} disabled)`);

  return allFlags;
}
