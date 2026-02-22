import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_DATABASE_URL environment variable is required');
  }

  const isAccelerate = connectionString.startsWith('prisma://');
  if (isAccelerate) {
    return new PrismaClient({ log: ['warn', 'error'] });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    const mediaItems = await prisma.mediaItem.findMany({
      select: {
        id: true,
        portfolioId: true,
        type: true,
        url: true,
        cdnUrl: true,
        thumbnailUrl: true,
        isApproved: true,
        createdAt: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        duration: true,
        portfolio: {
          select: {
            title: true,
            vendorProfileId: true,
            vendorProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    const rows = mediaItems.map((item, index) => ({
      serialNo: index + 1,
      mediaItemId: item.id,
      vendorProfileId: item.portfolio.vendorProfileId,
      businessName: item.portfolio.vendorProfile.businessName,
      portfolioId: item.portfolioId,
      portfolioTitle: item.portfolio.title,
      mediaType: item.type,
      mediaUrl: item.url,
      cdnUrl: item.cdnUrl ?? '',
      thumbnailUrl: item.thumbnailUrl ?? '',
      preferredUrl: item.cdnUrl ?? item.url,
      mimeType: item.mimeType,
      isApproved: item.isApproved,
      sizeBytes: item.size,
      width: item.width ?? '',
      height: item.height ?? '',
      durationSeconds: item.duration ?? '',
      createdAt: item.createdAt.toISOString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PortfolioMediaUrls');

    const outputDir = path.join(process.cwd(), 'exports');
    fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFilePath = path.join(outputDir, `portfolio-media-urls-${timestamp}.xlsx`);

    XLSX.writeFile(workbook, outputFilePath);

    console.log(`Export complete. Rows: ${rows.length}`);
    console.log(`File: ${outputFilePath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Export failed:', error);
  process.exit(1);
});
