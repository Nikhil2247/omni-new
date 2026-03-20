import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedSubscriptionPlans } from './seeds/subscription-plans.seed';

// Initialize Prisma with adapter (same as main seed.ts)
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
const isAccelerate = connectionString?.startsWith('prisma://');

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    });

async function main() {
  console.log('Seeding subscription plans only (no cleanup)...\n');

  try {
    const result = await seedSubscriptionPlans(prisma);

    console.log('\n--- Seeding Complete ---');
    console.log('Vendor Plans Created:');
    console.log(`  - Free: ${result.vendorPlans.free.id}`);
    console.log(`  - Professional: ${result.vendorPlans.pro.id}`);
    console.log(`  - Enterprise: ${result.vendorPlans.enterprise.id}`);
    console.log('\nUser Plans Created:');
    console.log(`  - Free: ${result.userPlans.free.id}`);
    console.log(`  - Basic: ${result.userPlans.basic.id}`);
    console.log(`  - Premium: ${result.userPlans.premium.id}`);
  } catch (error) {
    console.error('Error seeding plans:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
