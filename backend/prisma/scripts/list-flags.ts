import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
const isAccelerate = connectionString?.startsWith('prisma://');

const prisma = isAccelerate
  ? new PrismaClient()
  : new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString })) });

const shouldCleanup = process.argv.includes('--cleanup');

async function main() {
  // Find old flags that don't use dot notation
  const oldFlagKeys = [
    'CORE_LAUNCH_ENABLED',
    'MARKETING_BLOG_ENABLED',
    'OPS_DASHBOARD_ENABLED',
    'VENDOR_ONBOARDING_ENABLED',
  ];

  if (shouldCleanup) {
    console.log('🧹 Cleaning up old feature flags...\n');
    for (const key of oldFlagKeys) {
      const result = await prisma.featureFlag.deleteMany({ where: { key } });
      if (result.count > 0) {
        console.log('  Deleted:', key);
      }
    }
    console.log('');
  }

  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: 'asc' },
    select: { key: true, enabled: true }
  });

  console.log('Feature Flags in Database:');
  flags.forEach(f => console.log((f.enabled ? '[ON] ' : '[OFF]') + ' ' + f.key));
  console.log('\nTotal:', flags.length, 'flags');

  // Find any remaining old flags
  const remainingOld = flags.filter(f => !f.key.includes('.'));
  if (remainingOld.length > 0) {
    console.log('\n⚠️  Old flags to clean up (run with --cleanup):');
    remainingOld.forEach(f => console.log('  - ' + f.key));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
