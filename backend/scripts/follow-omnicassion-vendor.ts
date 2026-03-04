#!/usr/bin/env ts-node
// ============================================================================
// FOLLOW OMNICASSION VENDOR SCRIPT
// ============================================================================
// This script makes all existing users follow the Omnicassion vendor profile.
// The Omnicassion vendor is identified by the slug 'omnicassion'.
//
// Usage: npx ts-node scripts/follow-omnicassion-vendor.ts
// ============================================================================

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

const OMNICASSION_VENDOR_SLUG = 'omnicassion';

async function main() {
  console.log('============================================================');
  console.log('FOLLOW OMNICASSION VENDOR');
  console.log('============================================================\n');

  // Find the Omnicassion vendor profile
  const omnicassionVendor = await prisma.vendorProfile.findFirst({
    where: {
      slug: OMNICASSION_VENDOR_SLUG,
    },
    select: {
      id: true,
      businessName: true,
      slug: true,
    },
  });

  if (!omnicassionVendor) {
    console.error(`❌ Omnicassion vendor profile not found (slug: ${OMNICASSION_VENDOR_SLUG})`);
    console.error('Please ensure the Omnicassion vendor profile exists in the database.');
    process.exit(1);
  }

  console.log(`Found Omnicassion vendor: ${omnicassionVendor.businessName} (ID: ${omnicassionVendor.id})\n`);

  // Get all users who are NOT the vendor owner
  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      vendorProfile: {
        isNot: { id: omnicassionVendor.id },
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log(`Found ${users.length} users to process.\n`);

  if (users.length === 0) {
    console.log('No users to process.');
    process.exit(0);
  }

  // Get existing follows to skip
  const existingFollows = await prisma.vendorFollow.findMany({
    where: {
      vendorProfileId: omnicassionVendor.id,
    },
    select: {
      userId: true,
    },
  });

  const existingFollowerIds = new Set(existingFollows.map((f) => f.userId));
  console.log(`${existingFollowerIds.size} users already follow Omnicassion.\n`);

  // Filter to users who don't already follow
  const usersToFollow = users.filter((u) => !existingFollowerIds.has(u.id));

  if (usersToFollow.length === 0) {
    console.log('All users already follow Omnicassion. Nothing to do.');
    process.exit(0);
  }

  console.log(`Creating ${usersToFollow.length} new follows...\n`);

  // Create follows in batches
  const BATCH_SIZE = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < usersToFollow.length; i += BATCH_SIZE) {
    const batch = usersToFollow.slice(i, i + BATCH_SIZE);

    try {
      const result = await prisma.vendorFollow.createMany({
        data: batch.map((user) => ({
          userId: user.id,
          vendorProfileId: omnicassionVendor.id,
        })),
        skipDuplicates: true,
      });

      successCount += result.count;
      process.stdout.write(`Processed ${Math.min(i + BATCH_SIZE, usersToFollow.length)}/${usersToFollow.length} users...\r`);
    } catch (error) {
      errorCount += batch.length;
      console.error(`\nError processing batch at index ${i}:`, error);
    }
  }

  console.log('\n');

  // Update follower count for badge awarding
  const totalFollowers = await prisma.vendorFollow.count({
    where: { vendorProfileId: omnicassionVendor.id },
  });

  // Award follower badges to Omnicassion vendor
  console.log('Checking for new badges to award...');

  const definitions = await prisma.vendorBadgeDefinition.findMany({
    where: {
      metric: 'FOLLOWERS',
      isActive: true,
      threshold: { lte: totalFollowers },
    },
  });

  if (definitions.length > 0) {
    const definitionIds = definitions.map((d) => d.id);
    const existing = await prisma.vendorBadge.findMany({
      where: {
        vendorProfileId: omnicassionVendor.id,
        badgeDefinitionId: { in: definitionIds },
      },
      select: { badgeDefinitionId: true },
    });

    const existingIds = new Set(existing.map((b) => b.badgeDefinitionId));
    const toCreate = definitionIds
      .filter((id) => !existingIds.has(id))
      .map((id) => ({
        vendorProfileId: omnicassionVendor.id,
        badgeDefinitionId: id,
      }));

    if (toCreate.length > 0) {
      await prisma.vendorBadge.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      console.log(`Awarded ${toCreate.length} new badge(s) to Omnicassion vendor.`);
    }
  }

  // Summary
  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`New follows created: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total Omnicassion followers: ${totalFollowers}`);
  console.log('\n✅ Done!');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
