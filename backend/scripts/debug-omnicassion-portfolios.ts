import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
  // Find Omnicassion vendor
  const omnicassion = await prisma.vendorProfile.findFirst({
    where: { businessName: { contains: 'omnicassion', mode: 'insensitive' } },
    include: {
      portfolios: {
        orderBy: { createdAt: 'desc' },
        include: {
          mediaItems: {
            where: { isApproved: true },
            orderBy: { sortOrder: 'asc' },
            take: 3,
          },
        },
      },
    },
  });

  if (!omnicassion) {
    console.log('Omnicassion not found!');
    return;
  }

  console.log('Omnicassion ID:', omnicassion.id);
  console.log('Omnicassion slug:', omnicassion.slug);
  console.log('\nPortfolios:');

  omnicassion.portfolios.forEach((p, idx) => {
    console.log(`\n[${idx + 1}] ${p.title}`);
    console.log('    id:', p.id);
    console.log('    isFeatured:', p.isFeatured, '(type:', typeof p.isFeatured, ')');
    console.log('    sortOrder:', p.sortOrder);
    console.log('    mediaItems count:', p.mediaItems.length);
    if (p.mediaItems.length > 0) {
      console.log('    first media URL:', p.mediaItems[0].url);
    }
  });

  // Also check via raw SQL to ensure data is correct
  console.log('\n\n--- Raw SQL check ---');
  const rawPortfolios = await prisma.$queryRaw`
    SELECT id, title, "isFeatured", "sortOrder"
    FROM "Portfolio"
    WHERE "vendorProfileId" = ${omnicassion.id}
    ORDER BY "sortOrder"
  `;
  console.log(rawPortfolios);

  await prisma.$disconnect();
}

debug();
