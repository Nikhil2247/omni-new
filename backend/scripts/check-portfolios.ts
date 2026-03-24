import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const portfolios = await prisma.portfolio.findMany({
    where: {
      vendorProfile: {
        businessName: { contains: 'omnicassion', mode: 'insensitive' }
      }
    },
    select: {
      id: true,
      title: true,
      isFeatured: true,
      _count: { select: { mediaItems: true } }
    }
  });

  console.log('Portfolios for Omnicassion:');
  portfolios.forEach(p => {
    console.log(`  - ${p.title} | isFeatured: ${p.isFeatured} | media: ${p._count.mediaItems}`);
  });

  await prisma.$disconnect();
}

check();
