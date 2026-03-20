import {
  PrismaClient,
  PlanTier,
  UserPlanTier,
  FeatureLimitType,
  BillingCycle,
} from '@prisma/client';

// ============================================================================
// VENDOR SUBSCRIPTION PLANS SEED
// ============================================================================

interface VendorFeatureDefinition {
  key: string;
  name: string;
  description: string;
  limitType: FeatureLimitType;
  values: {
    FREE: number | null;
    PROFESSIONAL: number | null;
    ENTERPRISE: number | null;
  };
  sortOrder: number;
  isHighlighted?: boolean;
}

const vendorFeatures: VendorFeatureDefinition[] = [
  {
    key: 'messaging',
    name: 'Direct Messaging',
    description: 'Send and receive messages with potential clients',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, PROFESSIONAL: 1, ENTERPRISE: 1 },
    sortOrder: 1,
    isHighlighted: true,
  },
  {
    key: 'ai_recommendations',
    name: 'AI Recommendations',
    description: 'Get AI-powered recommendations for your business',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, PROFESSIONAL: 1, ENTERPRISE: 1 },
    sortOrder: 2,
  },
  {
    key: 'portfolios_limit',
    name: 'Portfolio Albums',
    description: 'Number of portfolio albums you can create',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 2, PROFESSIONAL: 10, ENTERPRISE: null }, // null = unlimited
    sortOrder: 3,
  },
  {
    key: 'images_per_album',
    name: 'Images per Album',
    description: 'Maximum images allowed per portfolio album',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 25, PROFESSIONAL: 100, ENTERPRISE: null }, // null = unlimited
    sortOrder: 4,
  },
  {
    key: 'search_boost',
    name: 'Search Boost',
    description: 'Priority ranking in search results',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 0, PROFESSIONAL: 50, ENTERPRISE: 100 },
    sortOrder: 5,
    isHighlighted: true,
  },
  {
    key: 'featured_sections',
    name: 'Featured Sections',
    description: 'Appear in featured vendor sections',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, PROFESSIONAL: 1, ENTERPRISE: 1 },
    sortOrder: 6,
  },
  {
    key: 'premium_badges',
    name: 'Premium Badges',
    description: 'Display exclusive premium badges on your profile',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, PROFESSIONAL: 0, ENTERPRISE: 1 },
    sortOrder: 7,
    isHighlighted: true,
  },
  {
    key: 'ad_credits_monthly',
    name: 'Ad Credits (Monthly)',
    description: 'Monthly advertising credits for promotions',
    limitType: FeatureLimitType.COUNT_PER_MONTH,
    values: { FREE: 0, PROFESSIONAL: 2000, ENTERPRISE: 5000 },
    sortOrder: 8,
  },
  {
    key: 'services_limit',
    name: 'Services Limit',
    description: 'Maximum number of services you can list',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 5, PROFESSIONAL: 20, ENTERPRISE: null }, // null = unlimited
    sortOrder: 9,
  },
];

// ============================================================================
// USER SUBSCRIPTION PLANS SEED
// ============================================================================

interface UserFeatureDefinition {
  key: string;
  name: string;
  description: string;
  limitType: FeatureLimitType;
  values: {
    FREE: number | null;
    BASIC: number | null;
    PREMIUM: number | null;
  };
  sortOrder: number;
  isHighlighted?: boolean;
}

const userFeatures: UserFeatureDefinition[] = [
  {
    key: 'guests_per_event',
    name: 'Guests per Event',
    description: 'Maximum number of guests per event',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 50, BASIC: 200, PREMIUM: null }, // null = unlimited
    sortOrder: 1,
  },
  {
    key: 'memory_enabled',
    name: 'Event Memories',
    description: 'Enable photo and video memories for your event',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 1, BASIC: 1, PREMIUM: 1 },
    sortOrder: 2,
  },
  {
    key: 'memory_uploads_per_event',
    name: 'Memory Uploads per Event',
    description: 'Number of photos/videos guests can upload per event',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 20, BASIC: 100, PREMIUM: null }, // null = unlimited
    sortOrder: 3,
  },
  {
    key: 'memory_storage_mb',
    name: 'Memory Storage (MB)',
    description: 'Total storage space for event memories',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 100, BASIC: 1000, PREMIUM: 10000 },
    sortOrder: 4,
  },
  {
    key: 'memory_download_enabled',
    name: 'Memory Downloads',
    description: 'Allow downloading of event memories',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, BASIC: 1, PREMIUM: 1 },
    sortOrder: 5,
    isHighlighted: true,
  },
  {
    key: 'einvite_enabled',
    name: 'E-Invitations',
    description: 'Send digital invitations to guests',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, BASIC: 1, PREMIUM: 1 },
    sortOrder: 6,
    isHighlighted: true,
  },
  {
    key: 'whatsapp_invites_per_event',
    name: 'WhatsApp Invites per Event',
    description: 'Number of WhatsApp invitations per event',
    limitType: FeatureLimitType.COUNT,
    values: { FREE: 0, BASIC: 200, PREMIUM: null }, // null = unlimited
    sortOrder: 7,
  },
  {
    key: 'custom_invite_templates',
    name: 'Custom Invite Templates',
    description: 'Create custom invitation templates',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, BASIC: 0, PREMIUM: 1 },
    sortOrder: 8,
    isHighlighted: true,
  },
  {
    key: 'rsvp_tracking',
    name: 'RSVP Tracking',
    description: 'Track guest responses and attendance',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, BASIC: 1, PREMIUM: 1 },
    sortOrder: 9,
  },
  {
    key: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority customer support',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, BASIC: 0, PREMIUM: 1 },
    sortOrder: 10,
    isHighlighted: true,
  },
  {
    key: 'export_data',
    name: 'Data Export',
    description: 'Export your event data and guest lists',
    limitType: FeatureLimitType.BOOLEAN,
    values: { FREE: 0, BASIC: 1, PREMIUM: 1 },
    sortOrder: 11,
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedSubscriptionPlans(prisma: PrismaClient) {
  console.log('Seeding subscription plans...');

  // ============================================================================
  // VENDOR SUBSCRIPTION PLANS
  // ============================================================================
  console.log('  Creating vendor subscription plans...');

  // Upsert FREE vendor plan
  const vendorFreePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'vendor-free' },
    update: {
      name: 'Free',
      description: 'Get started with basic features for your vendor profile',
      tier: PlanTier.FREE,
      displayOrder: 0,
      isPopular: false,
      trialDays: 0,
      isActive: true,
      isPublic: true,
    },
    create: {
      name: 'Free',
      slug: 'vendor-free',
      description: 'Get started with basic features for your vendor profile',
      tier: PlanTier.FREE,
      displayOrder: 0,
      isPopular: false,
      trialDays: 0,
      isActive: true,
      isPublic: true,
    },
  });

  // Upsert PRO vendor plan
  const vendorProPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'vendor-pro' },
    update: {
      name: 'Professional',
      description: 'Grow your business with advanced features and more visibility',
      tier: PlanTier.PROFESSIONAL,
      displayOrder: 1,
      isPopular: true,
      trialDays: 14,
      isActive: true,
      isPublic: true,
    },
    create: {
      name: 'Professional',
      slug: 'vendor-pro',
      description: 'Grow your business with advanced features and more visibility',
      tier: PlanTier.PROFESSIONAL,
      displayOrder: 1,
      isPopular: true,
      trialDays: 14,
      isActive: true,
      isPublic: true,
    },
  });

  // Upsert ENTERPRISE vendor plan
  const vendorEnterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'vendor-enterprise' },
    update: {
      name: 'Enterprise',
      description: 'Maximum visibility and premium features for established businesses',
      tier: PlanTier.ENTERPRISE,
      displayOrder: 2,
      isPopular: false,
      trialDays: 30,
      isActive: true,
      isPublic: true,
    },
    create: {
      name: 'Enterprise',
      slug: 'vendor-enterprise',
      description: 'Maximum visibility and premium features for established businesses',
      tier: PlanTier.ENTERPRISE,
      displayOrder: 2,
      isPopular: false,
      trialDays: 30,
      isActive: true,
      isPublic: true,
    },
  });

  // Upsert vendor plan features
  for (const feature of vendorFeatures) {
    // FREE plan features
    await prisma.planFeature.upsert({
      where: {
        planId_featureKey: { planId: vendorFreePlan.id, featureKey: feature.key },
      },
      update: {
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.FREE === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.FREE,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
      create: {
        planId: vendorFreePlan.id,
        featureKey: feature.key,
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.FREE === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.FREE,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
    });

    // PRO plan features
    await prisma.planFeature.upsert({
      where: {
        planId_featureKey: { planId: vendorProPlan.id, featureKey: feature.key },
      },
      update: {
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.PROFESSIONAL === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.PROFESSIONAL,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
      create: {
        planId: vendorProPlan.id,
        featureKey: feature.key,
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.PROFESSIONAL === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.PROFESSIONAL,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
    });

    // ENTERPRISE plan features
    await prisma.planFeature.upsert({
      where: {
        planId_featureKey: { planId: vendorEnterprisePlan.id, featureKey: feature.key },
      },
      update: {
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.ENTERPRISE === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.ENTERPRISE,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
      create: {
        planId: vendorEnterprisePlan.id,
        featureKey: feature.key,
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.ENTERPRISE === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.ENTERPRISE,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
    });
  }

  // Upsert vendor plan prices
  // FREE plan - only monthly at 0
  await prisma.planPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: vendorFreePlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.MONTHLY,
      },
    },
    update: { amount: 0, savingsPercent: null, isActive: true },
    create: {
      planId: vendorFreePlan.id,
      currency: 'INR',
      amount: 0,
      billingCycle: BillingCycle.MONTHLY,
      savingsPercent: null,
      isActive: true,
    },
  });

  // PRO plan prices
  await prisma.planPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: vendorProPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.MONTHLY,
      },
    },
    update: { amount: 999, savingsPercent: null, isActive: true },
    create: {
      planId: vendorProPlan.id,
      currency: 'INR',
      amount: 999,
      billingCycle: BillingCycle.MONTHLY,
      savingsPercent: null,
      isActive: true,
    },
  });

  await prisma.planPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: vendorProPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.QUARTERLY,
      },
    },
    update: { amount: 2499, savingsPercent: 17, isActive: true },
    create: {
      planId: vendorProPlan.id,
      currency: 'INR',
      amount: 2499,
      billingCycle: BillingCycle.QUARTERLY,
      savingsPercent: 17,
      isActive: true,
    },
  });

  await prisma.planPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: vendorProPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.YEARLY,
      },
    },
    update: { amount: 7999, savingsPercent: 33, isActive: true },
    create: {
      planId: vendorProPlan.id,
      currency: 'INR',
      amount: 7999,
      billingCycle: BillingCycle.YEARLY,
      savingsPercent: 33,
      isActive: true,
    },
  });

  // ENTERPRISE plan prices
  await prisma.planPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: vendorEnterprisePlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.MONTHLY,
      },
    },
    update: { amount: 2999, savingsPercent: null, isActive: true },
    create: {
      planId: vendorEnterprisePlan.id,
      currency: 'INR',
      amount: 2999,
      billingCycle: BillingCycle.MONTHLY,
      savingsPercent: null,
      isActive: true,
    },
  });

  await prisma.planPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: vendorEnterprisePlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.QUARTERLY,
      },
    },
    update: { amount: 7499, savingsPercent: 17, isActive: true },
    create: {
      planId: vendorEnterprisePlan.id,
      currency: 'INR',
      amount: 7499,
      billingCycle: BillingCycle.QUARTERLY,
      savingsPercent: 17,
      isActive: true,
    },
  });

  await prisma.planPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: vendorEnterprisePlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.YEARLY,
      },
    },
    update: { amount: 24999, savingsPercent: 30, isActive: true },
    create: {
      planId: vendorEnterprisePlan.id,
      currency: 'INR',
      amount: 24999,
      billingCycle: BillingCycle.YEARLY,
      savingsPercent: 30,
      isActive: true,
    },
  });

  console.log('  Vendor subscription plans created');

  // ============================================================================
  // USER SUBSCRIPTION PLANS
  // ============================================================================
  console.log('  Creating user subscription plans...');

  // Upsert FREE user plan
  const userFreePlan = await prisma.userSubscriptionPlan.upsert({
    where: { slug: 'user-free' },
    update: {
      name: 'Free',
      description: 'Basic event planning features to get you started',
      tier: UserPlanTier.FREE,
      displayOrder: 0,
      isPopular: false,
      trialDays: 0,
      isActive: true,
      isPublic: true,
    },
    create: {
      name: 'Free',
      slug: 'user-free',
      description: 'Basic event planning features to get you started',
      tier: UserPlanTier.FREE,
      displayOrder: 0,
      isPopular: false,
      trialDays: 0,
      isActive: true,
      isPublic: true,
    },
  });

  // Upsert BASIC user plan
  const userBasicPlan = await prisma.userSubscriptionPlan.upsert({
    where: { slug: 'user-basic' },
    update: {
      name: 'Basic',
      description: 'Enhanced planning tools for your special events',
      tier: UserPlanTier.BASIC,
      displayOrder: 1,
      isPopular: true,
      trialDays: 7,
      isActive: true,
      isPublic: true,
    },
    create: {
      name: 'Basic',
      slug: 'user-basic',
      description: 'Enhanced planning tools for your special events',
      tier: UserPlanTier.BASIC,
      displayOrder: 1,
      isPopular: true,
      trialDays: 7,
      isActive: true,
      isPublic: true,
    },
  });

  // Upsert PREMIUM user plan
  const userPremiumPlan = await prisma.userSubscriptionPlan.upsert({
    where: { slug: 'user-premium' },
    update: {
      name: 'Premium',
      description: 'All-inclusive planning suite with unlimited features',
      tier: UserPlanTier.PREMIUM,
      displayOrder: 2,
      isPopular: false,
      trialDays: 14,
      isActive: true,
      isPublic: true,
    },
    create: {
      name: 'Premium',
      slug: 'user-premium',
      description: 'All-inclusive planning suite with unlimited features',
      tier: UserPlanTier.PREMIUM,
      displayOrder: 2,
      isPopular: false,
      trialDays: 14,
      isActive: true,
      isPublic: true,
    },
  });

  // Upsert user plan features
  for (const feature of userFeatures) {
    // FREE plan features
    await prisma.userPlanFeature.upsert({
      where: {
        planId_featureKey: { planId: userFreePlan.id, featureKey: feature.key },
      },
      update: {
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.FREE === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.FREE,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
      create: {
        planId: userFreePlan.id,
        featureKey: feature.key,
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.FREE === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.FREE,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
    });

    // BASIC plan features
    await prisma.userPlanFeature.upsert({
      where: {
        planId_featureKey: { planId: userBasicPlan.id, featureKey: feature.key },
      },
      update: {
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.BASIC === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.BASIC,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
      create: {
        planId: userBasicPlan.id,
        featureKey: feature.key,
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.BASIC === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.BASIC,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
    });

    // PREMIUM plan features
    await prisma.userPlanFeature.upsert({
      where: {
        planId_featureKey: { planId: userPremiumPlan.id, featureKey: feature.key },
      },
      update: {
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.PREMIUM === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.PREMIUM,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
      create: {
        planId: userPremiumPlan.id,
        featureKey: feature.key,
        featureName: feature.name,
        description: feature.description,
        limitType: feature.values.PREMIUM === null ? FeatureLimitType.UNLIMITED : feature.limitType,
        limitValue: feature.values.PREMIUM,
        isHighlighted: feature.isHighlighted ?? false,
        sortOrder: feature.sortOrder,
      },
    });
  }

  // Upsert user plan prices
  // FREE plan - only monthly at 0
  await prisma.userPlanPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: userFreePlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.MONTHLY,
      },
    },
    update: { amount: 0, savingsPercent: null, isActive: true },
    create: {
      planId: userFreePlan.id,
      currency: 'INR',
      amount: 0,
      billingCycle: BillingCycle.MONTHLY,
      savingsPercent: null,
      isActive: true,
    },
  });

  // BASIC plan prices
  await prisma.userPlanPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: userBasicPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.MONTHLY,
      },
    },
    update: { amount: 299, savingsPercent: null, isActive: true },
    create: {
      planId: userBasicPlan.id,
      currency: 'INR',
      amount: 299,
      billingCycle: BillingCycle.MONTHLY,
      savingsPercent: null,
      isActive: true,
    },
  });

  await prisma.userPlanPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: userBasicPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.QUARTERLY,
      },
    },
    update: { amount: 749, savingsPercent: 17, isActive: true },
    create: {
      planId: userBasicPlan.id,
      currency: 'INR',
      amount: 749,
      billingCycle: BillingCycle.QUARTERLY,
      savingsPercent: 17,
      isActive: true,
    },
  });

  await prisma.userPlanPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: userBasicPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.YEARLY,
      },
    },
    update: { amount: 2399, savingsPercent: 33, isActive: true },
    create: {
      planId: userBasicPlan.id,
      currency: 'INR',
      amount: 2399,
      billingCycle: BillingCycle.YEARLY,
      savingsPercent: 33,
      isActive: true,
    },
  });

  // PREMIUM plan prices
  await prisma.userPlanPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: userPremiumPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.MONTHLY,
      },
    },
    update: { amount: 999, savingsPercent: null, isActive: true },
    create: {
      planId: userPremiumPlan.id,
      currency: 'INR',
      amount: 999,
      billingCycle: BillingCycle.MONTHLY,
      savingsPercent: null,
      isActive: true,
    },
  });

  await prisma.userPlanPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: userPremiumPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.QUARTERLY,
      },
    },
    update: { amount: 2499, savingsPercent: 17, isActive: true },
    create: {
      planId: userPremiumPlan.id,
      currency: 'INR',
      amount: 2499,
      billingCycle: BillingCycle.QUARTERLY,
      savingsPercent: 17,
      isActive: true,
    },
  });

  await prisma.userPlanPrice.upsert({
    where: {
      planId_currency_billingCycle: {
        planId: userPremiumPlan.id,
        currency: 'INR',
        billingCycle: BillingCycle.YEARLY,
      },
    },
    update: { amount: 7999, savingsPercent: 33, isActive: true },
    create: {
      planId: userPremiumPlan.id,
      currency: 'INR',
      amount: 7999,
      billingCycle: BillingCycle.YEARLY,
      savingsPercent: 33,
      isActive: true,
    },
  });

  console.log('  User subscription plans created');

  console.log('Subscription plans seeding completed!');

  return {
    vendorPlans: {
      free: vendorFreePlan,
      pro: vendorProPlan,
      enterprise: vendorEnterprisePlan,
    },
    userPlans: {
      free: userFreePlan,
      basic: userBasicPlan,
      premium: userPremiumPlan,
    },
  };
}
