import 'dotenv/config'
import {
  PrismaClient,
  EventTier,
  BundleType,
  FeatureLimitType,
} from '@prisma/client'

// ============================================================================
// EVENT CREDIT PRODUCTS SEED
// ============================================================================
// Pricing:
// - Basic Single: ₹499
// - Basic 5-Pack: ₹1,996 (20% off)
// - Basic 10-Pack: ₹3,743 (25% off)
// - Premium Single: ₹1,299
// - Premium 5-Pack: ₹5,196 (20% off)
// - Premium 10-Pack: ₹9,743 (25% off)
// ============================================================================

interface EventCreditProductDefinition {
  tier: EventTier;
  bundleType: BundleType;
  creditCount: number;
  priceInr: number;
  discountPercent: number | null;
  displayOrder: number;
}

const eventCreditProducts: EventCreditProductDefinition[] = [
  // Basic Tier Products
  {
    tier: EventTier.BASIC,
    bundleType: BundleType.SINGLE,
    creditCount: 1,
    priceInr: 499,
    discountPercent: null,
    displayOrder: 1,
  },
  {
    tier: EventTier.BASIC,
    bundleType: BundleType.FIVE_PACK,
    creditCount: 5,
    priceInr: 1996, // 4x single price = 20% off
    discountPercent: 20,
    displayOrder: 2,
  },
  {
    tier: EventTier.BASIC,
    bundleType: BundleType.TEN_PACK,
    creditCount: 10,
    priceInr: 3743, // 7.5x single price = 25% off
    discountPercent: 25,
    displayOrder: 3,
  },
  // Premium Tier Products
  {
    tier: EventTier.PREMIUM,
    bundleType: BundleType.SINGLE,
    creditCount: 1,
    priceInr: 1299,
    discountPercent: null,
    displayOrder: 4,
  },
  {
    tier: EventTier.PREMIUM,
    bundleType: BundleType.FIVE_PACK,
    creditCount: 5,
    priceInr: 5196, // 4x single price = 20% off
    discountPercent: 20,
    displayOrder: 5,
  },
  {
    tier: EventTier.PREMIUM,
    bundleType: BundleType.TEN_PACK,
    creditCount: 10,
    priceInr: 9743, // 7.5x single price = 25% off
    discountPercent: 25,
    displayOrder: 6,
  },
];

// ============================================================================
// EVENT TIER FEATURES SEED
// ============================================================================

interface EventTierFeatureDefinition {
  key: string;
  name: string;
  description: string;
  limitType: FeatureLimitType;
  values: {
    BASIC: number | null;
    PREMIUM: number | null;
  };
  sortOrder: number;
  isHighlighted?: boolean;
}

const eventTierFeatures: EventTierFeatureDefinition[] = [
  {
    key: 'guests_per_event',
    name: 'Guests per Event',
    description: 'Maximum number of guests per event',
    limitType: FeatureLimitType.COUNT,
    values: { BASIC: 200, PREMIUM: null }, // null = unlimited
    sortOrder: 1,
  },
  {
    key: 'memory_enabled',
    name: 'Event Memories',
    description: 'Enable photo and video memories for your event',
    limitType: FeatureLimitType.BOOLEAN,
    values: { BASIC: 1, PREMIUM: 1 },
    sortOrder: 2,
  },
  {
    key: 'memory_uploads_per_event',
    name: 'Memory Uploads per Event',
    description: 'Number of photos/videos guests can upload per event',
    limitType: FeatureLimitType.COUNT,
    values: { BASIC: 100, PREMIUM: null }, // null = unlimited
    sortOrder: 3,
  },
  {
    key: 'memory_storage_mb',
    name: 'Memory Storage (MB)',
    description: 'Total storage space for event memories',
    limitType: FeatureLimitType.COUNT,
    values: { BASIC: 1000, PREMIUM: 10000 },
    sortOrder: 4,
  },
  {
    key: 'memory_download_enabled',
    name: 'Memory Downloads',
    description: 'Allow downloading of event memories',
    limitType: FeatureLimitType.BOOLEAN,
    values: { BASIC: 1, PREMIUM: 1 },
    sortOrder: 5,
    isHighlighted: true,
  },
  {
    key: 'einvite_enabled',
    name: 'E-Invitations',
    description: 'Send digital invitations to guests',
    limitType: FeatureLimitType.BOOLEAN,
    values: { BASIC: 1, PREMIUM: 1 },
    sortOrder: 6,
    isHighlighted: true,
  },
  {
    key: 'whatsapp_invites_per_event',
    name: 'WhatsApp Invites per Event',
    description: 'Number of WhatsApp invitations per event',
    limitType: FeatureLimitType.COUNT,
    values: { BASIC: 200, PREMIUM: null }, // null = unlimited
    sortOrder: 7,
  },
  {
    key: 'custom_invite_templates',
    name: 'Custom Invite Templates',
    description: 'Create custom invitation templates',
    limitType: FeatureLimitType.BOOLEAN,
    values: { BASIC: 0, PREMIUM: 1 },
    sortOrder: 8,
    isHighlighted: true,
  },
  {
    key: 'rsvp_tracking',
    name: 'RSVP Tracking',
    description: 'Track guest responses and attendance',
    limitType: FeatureLimitType.BOOLEAN,
    values: { BASIC: 1, PREMIUM: 1 },
    sortOrder: 9,
  },
  {
    key: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority customer support',
    limitType: FeatureLimitType.BOOLEAN,
    values: { BASIC: 0, PREMIUM: 1 },
    sortOrder: 10,
    isHighlighted: true,
  },
  {
    key: 'export_data',
    name: 'Data Export',
    description: 'Export your event data and guest lists',
    limitType: FeatureLimitType.BOOLEAN,
    values: { BASIC: 1, PREMIUM: 1 },
    sortOrder: 11,
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedEventCredits(prisma: PrismaClient) {
  console.log('Seeding event credit products and tier features...');

  // ============================================================================
  // EVENT CREDIT PRODUCTS
  // ============================================================================
  console.log('  Creating event credit products...');

  for (const product of eventCreditProducts) {
    await prisma.eventCreditProduct.upsert({
      where: {
        tier_bundleType: {
          tier: product.tier,
          bundleType: product.bundleType,
        },
      },
      update: {
        creditCount: product.creditCount,
        priceInr: product.priceInr,
        discountPercent: product.discountPercent,
        displayOrder: product.displayOrder,
        isActive: true,
      },
      create: {
        tier: product.tier,
        bundleType: product.bundleType,
        creditCount: product.creditCount,
        priceInr: product.priceInr,
        discountPercent: product.discountPercent,
        displayOrder: product.displayOrder,
        isActive: true,
      },
    });
    console.log(`    Created/Updated: ${product.tier} ${product.bundleType} - ₹${product.priceInr}`);
  }

  // ============================================================================
  // EVENT TIER FEATURES
  // ============================================================================
  console.log('  Creating event tier features...');

  const tiers: EventTier[] = [EventTier.BASIC, EventTier.PREMIUM];

  for (const tier of tiers) {
    for (const feature of eventTierFeatures) {
      const limitValue = feature.values[tier];

      await prisma.eventTierFeature.upsert({
        where: {
          tier_featureKey: {
            tier: tier,
            featureKey: feature.key,
          },
        },
        update: {
          featureName: feature.name,
          description: feature.description,
          limitType: feature.limitType,
          limitValue: limitValue,
          isEnabled: true,
          isHighlighted: feature.isHighlighted ?? false,
          sortOrder: feature.sortOrder,
        },
        create: {
          tier: tier,
          featureKey: feature.key,
          featureName: feature.name,
          description: feature.description,
          limitType: feature.limitType,
          limitValue: limitValue,
          isEnabled: true,
          isHighlighted: feature.isHighlighted ?? false,
          sortOrder: feature.sortOrder,
        },
      });
    }
    console.log(`    Created/Updated features for ${tier} tier`);
  }

  console.log('Event credit products and tier features seeded successfully!');
}

// ============================================================================
// STANDALONE EXECUTION
// ============================================================================

async function main() {
  const prisma = new PrismaClient();

  try {
    await seedEventCredits(prisma);
  } catch (error) {
    console.error('Error seeding event credits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
