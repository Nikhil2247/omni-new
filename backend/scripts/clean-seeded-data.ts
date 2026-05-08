// ============================================================================
// CLEAN SEEDED DATA - Keep only essential config (categories, roles, etc.)
// ============================================================================

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

async function cleanSeededData(): Promise<void> {
  console.log('🧹 Cleaning seeded data (keeping categories, roles, locations)...\n');

  const prisma = createPrismaClient();

  try {
    // Use raw SQL to truncate tables with CASCADE
    // This handles all foreign key constraints automatically

    const tablesToClean = [
      // User related
      'public.notifications',
      'public.user_sessions',
      'public.user_role_assignments',

      // Vendor related
      'catalog.vendor_reviews',
      'catalog.vendor_follows',
      'catalog.vendor_badges',
      'catalog.vendor_kyc',
      'catalog.media_items',
      'catalog.portfolios',
      'catalog.pricing_tiers',
      'catalog.services',
      'catalog.vendor_tags',
      'catalog.service_areas',
      'catalog.business_hours',
      'catalog.vendor_profiles',

      // Interaction related
      'interaction.wishlist_items',
      'interaction.wishlists',
      'interaction.messages',
      'interaction.conversations',
      'interaction.leads',

      // Planning related
      'planning.checklist_items',
      'planning.checklists',
      'planning.timelines',
      'planning.guests',
      'planning.e_invites',
      'planning.event_vendors',
      'planning.events',
      'planning.chatbot_messages',
      'planning.chatbot_conversations',

      // Content related
      'content.blog_post_tags',
      'content.blog_posts',

      // Operations related
      'operations.vendor_tasks',
      'operations.invoices',
      'operations.disputes',
      'operations.agreements',
      'operations.support_tickets',

      // Addresses
      'public.addresses',

      // Users last
      'public.users',
    ];

    for (const table of tablesToClean) {
      try {
        console.log(`Truncating ${table}...`);
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE`);
      } catch (err: any) {
        // Table might not exist, skip
        if (!err.message?.includes('does not exist')) {
          console.log(`  ⚠️ Skipped ${table}: ${err.message?.substring(0, 50)}`);
        }
      }
    }

    console.log('\n✅ Seeded data cleaned successfully!');
    console.log('\n📋 Kept: Categories, Roles, Locations, Tags, System Config, Feature Flags, E-invite Templates');
    console.log('\n🔄 Now run: npm run migrate:mongodb');

  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanSeededData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
