#!/usr/bin/env ts-node
// ============================================================================
// SEED BADGE DEFINITIONS SCRIPT
// ============================================================================
// This script creates all badge definitions in the database.
// Run this before recalculate-vendor-badges.ts
//
// Usage: npx ts-node scripts/seed-badge-definitions.ts
// ============================================================================

import 'dotenv/config';
import { PrismaClient, VendorBadgeMetric } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Initialize Prisma with adapter
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
const isAccelerate = connectionString?.startsWith('prisma://');

const prisma = isAccelerate
  ? new PrismaClient({ log: ['warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['warn', 'error'],
    });

const badgeDefinitions = [
  // ═══════════════════════════════════════════════════════════════════
  // FOLLOWERS BADGES (10 → 1M)
  // ═══════════════════════════════════════════════════════════════════
  {
    key: 'followers-10',
    name: 'Rising Star',
    description: 'Reached 10 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 10,
    icon: 'user-plus',
    color: 'slate',
  },
  {
    key: 'followers-25',
    name: 'Getting Popular',
    description: 'Reached 25 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 25,
    icon: 'users',
    color: 'zinc',
  },
  {
    key: 'followers-50',
    name: 'Community Favorite',
    description: 'Reached 50 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 50,
    icon: 'heart',
    color: 'emerald',
  },
  {
    key: 'followers-100',
    name: 'Trending Vendor',
    description: 'Reached 100 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 100,
    icon: 'trending-up',
    color: 'teal',
  },
  {
    key: 'followers-250',
    name: 'Local Hero',
    description: 'Reached 250 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 250,
    icon: 'award',
    color: 'cyan',
  },
  {
    key: 'followers-500',
    name: 'Rising Influence',
    description: 'Reached 500 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 500,
    icon: 'star',
    color: 'sky',
  },
  {
    key: 'followers-1000',
    name: 'Top Pick',
    description: 'Reached 1,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 1000,
    icon: 'sparkles',
    color: 'blue',
  },
  {
    key: 'followers-2500',
    name: 'Fan Favorite',
    description: 'Reached 2,500 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 2500,
    icon: 'flame',
    color: 'indigo',
  },
  {
    key: 'followers-5000',
    name: 'Community Champion',
    description: 'Reached 5,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 5000,
    icon: 'medal',
    color: 'violet',
  },
  {
    key: 'followers-10000',
    name: 'Elite Vendor',
    description: 'Reached 10,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 10000,
    icon: 'trophy',
    color: 'purple',
  },
  {
    key: 'followers-25000',
    name: 'Industry Star',
    description: 'Reached 25,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 25000,
    icon: 'gem',
    color: 'fuchsia',
  },
  {
    key: 'followers-50000',
    name: 'Legendary Status',
    description: 'Reached 50,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 50000,
    icon: 'crown',
    color: 'pink',
  },
  {
    key: 'followers-100000',
    name: 'Iconic Vendor',
    description: 'Reached 100,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 100000,
    icon: 'zap',
    color: 'rose',
  },
  {
    key: 'followers-250000',
    name: 'Superstar',
    description: 'Reached 250,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 250000,
    icon: 'rocket',
    color: 'orange',
  },
  {
    key: 'followers-500000',
    name: 'Hall of Fame',
    description: 'Reached 500,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 500000,
    icon: 'shield',
    color: 'amber',
  },
  {
    key: 'followers-1000000',
    name: 'Million Club',
    description: 'Reached 1,000,000 followers',
    metric: VendorBadgeMetric.FOLLOWERS,
    threshold: 1000000,
    icon: 'diamond',
    color: 'yellow',
  },

  // ═══════════════════════════════════════════════════════════════════
  // REVIEWS BADGES (5 → 100K)
  // ═══════════════════════════════════════════════════════════════════
  {
    key: 'reviews-5',
    name: 'First Reviews',
    description: 'Received 5 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 5,
    icon: 'message-square',
    color: 'slate',
  },
  {
    key: 'reviews-10',
    name: 'Getting Feedback',
    description: 'Received 10 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 10,
    icon: 'message-circle',
    color: 'zinc',
  },
  {
    key: 'reviews-25',
    name: 'Trusted Choice',
    description: 'Received 25 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 25,
    icon: 'thumbs-up',
    color: 'emerald',
  },
  {
    key: 'reviews-50',
    name: 'Well Reviewed',
    description: 'Received 50 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 50,
    icon: 'star',
    color: 'teal',
  },
  {
    key: 'reviews-100',
    name: 'Highly Rated',
    description: 'Received 100 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 100,
    icon: 'award',
    color: 'cyan',
  },
  {
    key: 'reviews-250',
    name: 'Customer Favorite',
    description: 'Received 250 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 250,
    icon: 'heart',
    color: 'sky',
  },
  {
    key: 'reviews-500',
    name: 'Review Champion',
    description: 'Received 500 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 500,
    icon: 'medal',
    color: 'blue',
  },
  {
    key: 'reviews-1000',
    name: 'Review Master',
    description: 'Received 1,000 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 1000,
    icon: 'trophy',
    color: 'indigo',
  },
  {
    key: 'reviews-2500',
    name: 'Review Elite',
    description: 'Received 2,500 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 2500,
    icon: 'gem',
    color: 'violet',
  },
  {
    key: 'reviews-5000',
    name: 'Review Legend',
    description: 'Received 5,000 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 5000,
    icon: 'crown',
    color: 'purple',
  },
  {
    key: 'reviews-10000',
    name: 'Review Icon',
    description: 'Received 10,000 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 10000,
    icon: 'sparkles',
    color: 'fuchsia',
  },
  {
    key: 'reviews-25000',
    name: 'Review Royalty',
    description: 'Received 25,000 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 25000,
    icon: 'zap',
    color: 'pink',
  },
  {
    key: 'reviews-50000',
    name: 'Review Superstar',
    description: 'Received 50,000 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 50000,
    icon: 'rocket',
    color: 'rose',
  },
  {
    key: 'reviews-100000',
    name: 'Review Hall of Fame',
    description: 'Received 100,000 reviews',
    metric: VendorBadgeMetric.REVIEWS,
    threshold: 100000,
    icon: 'diamond',
    color: 'amber',
  },

  // ═══════════════════════════════════════════════════════════════════
  // LEADS BADGES (5 → 100K)
  // ═══════════════════════════════════════════════════════════════════
  {
    key: 'leads-5',
    name: 'First Inquiries',
    description: 'Received 5 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 5,
    icon: 'mail',
    color: 'slate',
  },
  {
    key: 'leads-10',
    name: 'Growing Interest',
    description: 'Received 10 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 10,
    icon: 'inbox',
    color: 'zinc',
  },
  {
    key: 'leads-25',
    name: 'Attracting Attention',
    description: 'Received 25 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 25,
    icon: 'bell',
    color: 'emerald',
  },
  {
    key: 'leads-50',
    name: 'In Demand',
    description: 'Received 50 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 50,
    icon: 'trending-up',
    color: 'teal',
  },
  {
    key: 'leads-100',
    name: 'Popular Choice',
    description: 'Received 100 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 100,
    icon: 'star',
    color: 'cyan',
  },
  {
    key: 'leads-250',
    name: 'Lead Magnet',
    description: 'Received 250 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 250,
    icon: 'zap',
    color: 'sky',
  },
  {
    key: 'leads-500',
    name: 'High Demand',
    description: 'Received 500 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 500,
    icon: 'flame',
    color: 'blue',
  },
  {
    key: 'leads-1000',
    name: 'Lead Champion',
    description: 'Received 1,000 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 1000,
    icon: 'target',
    color: 'indigo',
  },
  {
    key: 'leads-2500',
    name: 'Lead Master',
    description: 'Received 2,500 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 2500,
    icon: 'award',
    color: 'violet',
  },
  {
    key: 'leads-5000',
    name: 'Industry Leader',
    description: 'Received 5,000 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 5000,
    icon: 'trophy',
    color: 'purple',
  },
  {
    key: 'leads-10000',
    name: 'Lead Legend',
    description: 'Received 10,000 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 10000,
    icon: 'crown',
    color: 'fuchsia',
  },
  {
    key: 'leads-25000',
    name: 'Lead Elite',
    description: 'Received 25,000 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 25000,
    icon: 'gem',
    color: 'pink',
  },
  {
    key: 'leads-50000',
    name: 'Lead Superstar',
    description: 'Received 50,000 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 50000,
    icon: 'rocket',
    color: 'rose',
  },
  {
    key: 'leads-100000',
    name: 'Lead Hall of Fame',
    description: 'Received 100,000 leads',
    metric: VendorBadgeMetric.LEADS,
    threshold: 100000,
    icon: 'diamond',
    color: 'amber',
  },

  // ═══════════════════════════════════════════════════════════════════
  // VIEWS BADGES (100 → 10M)
  // ═══════════════════════════════════════════════════════════════════
  {
    key: 'views-100',
    name: 'First Impressions',
    description: 'Reached 100 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 100,
    icon: 'eye',
    color: 'slate',
  },
  {
    key: 'views-250',
    name: 'Getting Noticed',
    description: 'Reached 250 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 250,
    icon: 'eye',
    color: 'zinc',
  },
  {
    key: 'views-500',
    name: 'Rising Visibility',
    description: 'Reached 500 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 500,
    icon: 'search',
    color: 'emerald',
  },
  {
    key: 'views-1000',
    name: 'Spotlight Vendor',
    description: 'Reached 1,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 1000,
    icon: 'sparkles',
    color: 'teal',
  },
  {
    key: 'views-2500',
    name: 'Attention Grabber',
    description: 'Reached 2,500 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 2500,
    icon: 'star',
    color: 'cyan',
  },
  {
    key: 'views-5000',
    name: 'High Visibility',
    description: 'Reached 5,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 5000,
    icon: 'flame',
    color: 'sky',
  },
  {
    key: 'views-10000',
    name: 'Crowd Favorite',
    description: 'Reached 10,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 10000,
    icon: 'trending-up',
    color: 'blue',
  },
  {
    key: 'views-25000',
    name: 'Viral Vendor',
    description: 'Reached 25,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 25000,
    icon: 'zap',
    color: 'indigo',
  },
  {
    key: 'views-50000',
    name: 'View Master',
    description: 'Reached 50,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 50000,
    icon: 'award',
    color: 'violet',
  },
  {
    key: 'views-100000',
    name: 'View Champion',
    description: 'Reached 100,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 100000,
    icon: 'trophy',
    color: 'purple',
  },
  {
    key: 'views-250000',
    name: 'View Legend',
    description: 'Reached 250,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 250000,
    icon: 'crown',
    color: 'fuchsia',
  },
  {
    key: 'views-500000',
    name: 'View Elite',
    description: 'Reached 500,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 500000,
    icon: 'gem',
    color: 'pink',
  },
  {
    key: 'views-1000000',
    name: 'Million Views',
    description: 'Reached 1,000,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 1000000,
    icon: 'rocket',
    color: 'rose',
  },
  {
    key: 'views-5000000',
    name: 'View Superstar',
    description: 'Reached 5,000,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 5000000,
    icon: 'shield',
    color: 'orange',
  },
  {
    key: 'views-10000000',
    name: 'View Hall of Fame',
    description: 'Reached 10,000,000 profile views',
    metric: VendorBadgeMetric.VIEWS,
    threshold: 10000000,
    icon: 'diamond',
    color: 'amber',
  },
];

async function main() {
  console.log('============================================================');
  console.log('SEED BADGE DEFINITIONS');
  console.log('============================================================\n');

  // Check existing definitions
  const existingCount = await prisma.vendorBadgeDefinition.count();
  console.log(`Found ${existingCount} existing badge definitions.\n`);

  console.log(`Creating/updating ${badgeDefinitions.length} badge definitions...\n`);

  let created = 0;
  let updated = 0;

  for (const badge of badgeDefinitions) {
    const existing = await prisma.vendorBadgeDefinition.findUnique({
      where: { key: badge.key },
    });

    if (existing) {
      await prisma.vendorBadgeDefinition.update({
        where: { key: badge.key },
        data: badge,
      });
      updated++;
      console.log(`  Updated: ${badge.name} (${badge.key})`);
    } else {
      await prisma.vendorBadgeDefinition.create({
        data: badge,
      });
      created++;
      console.log(`  Created: ${badge.name} (${badge.key})`);
    }
  }

  // Summary
  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total: ${badgeDefinitions.length}`);

  // Show breakdown by metric
  const byMetric = badgeDefinitions.reduce((acc, b) => {
    acc[b.metric] = (acc[b.metric] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nBadges by metric:');
  Object.entries(byMetric).forEach(([metric, count]) => {
    console.log(`  ${metric}: ${count} badges`);
  });

  console.log('\n✅ Badge definitions seeded successfully!');
  console.log('\nNext steps:');
  console.log('  1. Run: npx ts-node scripts/recalculate-vendor-badges.ts');
  console.log('  2. Run: npx ts-node scripts/follow-omnicassion-vendor.ts');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
