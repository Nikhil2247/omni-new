#!/usr/bin/env ts-node
// ============================================================================
// RECALCULATE VENDOR BADGES SCRIPT
// ============================================================================
// This script recalculates and awards badges for all existing vendor profiles
// based on their current follower, review, lead, and view counts.
//
// Usage: npx ts-node scripts/recalculate-vendor-badges.ts
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

interface BadgeStats {
  vendorId: string;
  businessName: string;
  followers: number;
  reviews: number;
  leads: number;
  views: number;
  badgesAwarded: number;
}

async function awardBadgesForMetric(
  vendorProfileId: string,
  metric: VendorBadgeMetric,
  currentCount: number,
): Promise<number> {
  // Find all badge definitions for this metric where threshold is met
  const definitions = await prisma.vendorBadgeDefinition.findMany({
    where: {
      metric,
      isActive: true,
      threshold: { lte: currentCount },
    },
  });

  if (definitions.length === 0) return 0;

  // Get existing badges for this vendor
  const definitionIds = definitions.map((d) => d.id);
  const existing = await prisma.vendorBadge.findMany({
    where: {
      vendorProfileId,
      badgeDefinitionId: { in: definitionIds },
    },
    select: { badgeDefinitionId: true },
  });

  const existingIds = new Set(existing.map((b) => b.badgeDefinitionId));

  // Filter to only badges not yet awarded
  const toCreate = definitionIds
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ vendorProfileId, badgeDefinitionId: id }));

  if (toCreate.length === 0) return 0;

  // Create new badge awards
  await prisma.vendorBadge.createMany({
    data: toCreate,
    skipDuplicates: true,
  });

  return toCreate.length;
}

async function recalculateVendorBadges(vendorProfileId: string): Promise<BadgeStats> {
  // Get vendor profile with counts
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorProfileId },
    select: {
      id: true,
      businessName: true,
      viewCount: true,
    },
  });

  if (!vendor) {
    throw new Error(`Vendor profile not found: ${vendorProfileId}`);
  }

  // Count followers
  const followerCount = await prisma.vendorFollow.count({
    where: { vendorProfileId },
  });

  // Count approved reviews
  const reviewCount = await prisma.vendorReview.count({
    where: {
      vendorProfileId,
      status: 'APPROVED',
    },
  });

  // Count leads
  const leadCount = await prisma.lead.count({
    where: { vendorProfileId },
  });

  // Award badges for each metric
  let totalBadgesAwarded = 0;

  totalBadgesAwarded += await awardBadgesForMetric(
    vendorProfileId,
    VendorBadgeMetric.FOLLOWERS,
    followerCount,
  );

  totalBadgesAwarded += await awardBadgesForMetric(
    vendorProfileId,
    VendorBadgeMetric.REVIEWS,
    reviewCount,
  );

  totalBadgesAwarded += await awardBadgesForMetric(
    vendorProfileId,
    VendorBadgeMetric.LEADS,
    leadCount,
  );

  totalBadgesAwarded += await awardBadgesForMetric(
    vendorProfileId,
    VendorBadgeMetric.VIEWS,
    vendor.viewCount,
  );

  return {
    vendorId: vendor.id,
    businessName: vendor.businessName,
    followers: followerCount,
    reviews: reviewCount,
    leads: leadCount,
    views: vendor.viewCount,
    badgesAwarded: totalBadgesAwarded,
  };
}

async function main() {
  console.log('============================================================');
  console.log('RECALCULATE VENDOR BADGES');
  console.log('============================================================\n');

  // First, ensure badge definitions exist
  const definitionCount = await prisma.vendorBadgeDefinition.count();
  console.log(`Found ${definitionCount} badge definitions in database.`);

  if (definitionCount === 0) {
    console.error('\n❌ No badge definitions found!');
    console.error('Please run: npx prisma db seed');
    process.exit(1);
  }

  // Get all vendor profiles
  const vendors = await prisma.vendorProfile.findMany({
    select: { id: true, businessName: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${vendors.length} vendor profiles to process.\n`);

  if (vendors.length === 0) {
    console.log('No vendors to process.');
    process.exit(0);
  }

  let totalBadgesAwarded = 0;
  const results: BadgeStats[] = [];

  for (let i = 0; i < vendors.length; i++) {
    const vendor = vendors[i];
    process.stdout.write(`Processing ${i + 1}/${vendors.length}: ${vendor.businessName}... `);

    try {
      const stats = await recalculateVendorBadges(vendor.id);
      results.push(stats);
      totalBadgesAwarded += stats.badgesAwarded;

      if (stats.badgesAwarded > 0) {
        console.log(`✅ Awarded ${stats.badgesAwarded} badge(s)`);
      } else {
        console.log('No new badges');
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }

  // Summary
  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Total vendors processed: ${vendors.length}`);
  console.log(`Total badges awarded: ${totalBadgesAwarded}`);

  // Show vendors that received badges
  const vendorsWithNewBadges = results.filter((r) => r.badgesAwarded > 0);
  if (vendorsWithNewBadges.length > 0) {
    console.log('\nVendors that received new badges:');
    vendorsWithNewBadges.forEach((v) => {
      console.log(`  - ${v.businessName}: ${v.badgesAwarded} badge(s)`);
      console.log(`    (Followers: ${v.followers}, Reviews: ${v.reviews}, Leads: ${v.leads}, Views: ${v.views})`);
    });
  }

  console.log('\n✅ Badge recalculation complete!');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
