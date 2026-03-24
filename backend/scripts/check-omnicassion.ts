import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as Minio from 'minio';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Minio client
const minioClient = new Minio.Client({
  endPoint: 'files.omnicassion.com',
  port: 443,
  useSSL: true,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123',
});

// Album definitions
const albums = [
  {
    title: 'Wedding Ceremonies',
    description: 'Beautiful moments from traditional and modern wedding ceremonies',
    isFeatured: true,
    tags: ['wedding', 'ceremony', 'traditional', 'rituals'],
  },
  {
    title: 'Reception & Celebrations',
    description: 'Joyful celebrations and grand reception moments',
    isFeatured: true,
    tags: ['reception', 'celebration', 'party', 'dance'],
  },
  {
    title: 'Decor & Venues',
    description: 'Stunning venue decorations and floral arrangements',
    isFeatured: true,
    tags: ['decor', 'venue', 'flowers', 'setup'],
  },
  {
    title: 'Candid Moments',
    description: 'Natural and candid shots capturing genuine emotions',
    isFeatured: true,
    tags: ['candid', 'emotions', 'moments', 'natural'],
  },
  {
    title: 'Pre-Wedding Shoots',
    description: 'Creative pre-wedding photography sessions',
    isFeatured: false,
    tags: ['pre-wedding', 'couple', 'shoot', 'romantic'],
  },
  {
    title: 'Mehendi & Sangeet',
    description: 'Colorful mehendi ceremonies and sangeet nights',
    isFeatured: false,
    tags: ['mehendi', 'sangeet', 'haldi', 'music'],
  },
];

// Caption templates
const captions = [
  'A beautiful moment captured',
  'Love in every detail',
  'Celebrating togetherness',
  'Making memories',
  'Joy and happiness',
  'A perfect day',
  'Cherished moments',
  'Elegant celebrations',
  'Timeless beauty',
  'Pure bliss',
];

async function recreateOmnicassionPortfolios() {
  console.log('Starting Omnicassion portfolio recreation...\n');

  // Find Omnicassion vendor
  const omnicassion = await prisma.vendorProfile.findFirst({
    where: { businessName: { contains: 'omnicassion', mode: 'insensitive' } },
  });

  if (!omnicassion) {
    console.log('Omnicassion vendor not found!');
    return;
  }

  console.log('Found Omnicassion:', omnicassion.id);

  // Delete existing portfolios and media items for Omnicassion
  console.log('\nCleaning up existing portfolios...');
  const existingPortfolios = await prisma.portfolio.findMany({
    where: { vendorProfileId: omnicassion.id },
    select: { id: true },
  });

  if (existingPortfolios.length > 0) {
    const portfolioIds = existingPortfolios.map(p => p.id);
    const deletedMedia = await prisma.mediaItem.deleteMany({
      where: { portfolioId: { in: portfolioIds } },
    });
    console.log('  Deleted', deletedMedia.count, 'existing media items');

    const deletedPortfolios = await prisma.portfolio.deleteMany({
      where: { id: { in: portfolioIds } },
    });
    console.log('  Deleted', deletedPortfolios.count, 'existing portfolios');
  }

  // Get files from Minio
  console.log('\nFetching files from Minio...');
  const bucketName = 'omnicassion';
  const prefix = 'portfolio/';

  const files: string[] = [];
  const stream = minioClient.listObjects(bucketName, prefix, true);

  await new Promise<void>((resolve, reject) => {
    stream.on('data', (obj) => {
      if (obj.name && !obj.name.endsWith('/')) {
        files.push(obj.name);
      }
    });
    stream.on('error', reject);
    stream.on('end', resolve);
  });

  // Get only normal files (not thumbnails)
  const normalFiles = files.filter(f => !f.includes('thumb-'));
  console.log('Found', normalFiles.length, 'images to add');

  // Create portfolios
  console.log('\nCreating portfolios...');
  const createdPortfolios: { id: string; title: string; tags: string[] }[] = [];

  for (let i = 0; i < albums.length; i++) {
    const album = albums[i];
    const portfolio = await prisma.portfolio.create({
      data: {
        vendorProfileId: omnicassion.id,
        title: album.title,
        description: album.description,
        isFeatured: album.isFeatured,
        sortOrder: i,
      },
    });
    createdPortfolios.push({ id: portfolio.id, title: album.title, tags: album.tags });
    console.log('  Created:', album.title, album.isFeatured ? '(Featured)' : '');
  }

  // Distribute images across portfolios
  console.log('\nDistributing images across portfolios...');
  const baseUrl = 'https://files.omnicassion.com/omnicassion/';
  const imagesPerAlbum = Math.ceil(normalFiles.length / albums.length);

  let totalCreated = 0;

  for (let albumIdx = 0; albumIdx < createdPortfolios.length; albumIdx++) {
    const portfolio = createdPortfolios[albumIdx];
    const startIdx = albumIdx * imagesPerAlbum;
    const endIdx = Math.min(startIdx + imagesPerAlbum, normalFiles.length);
    const albumFiles = normalFiles.slice(startIdx, endIdx);

    for (let i = 0; i < albumFiles.length; i++) {
      const file = albumFiles[i];
      const url = baseUrl + file;

      // Get thumbnail URL by adding 'thumb-' prefix to filename
      const pathParts = file.split('/');
      const filename = pathParts.pop()!;
      const thumbFilename = 'thumb-' + filename;
      const thumbPath = [...pathParts, thumbFilename].join('/');
      const thumbnailUrl = baseUrl + thumbPath;

      const ext = file.split('.').pop()?.toLowerCase() || '';
      const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);

      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'avif': 'image/avif',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
      };
      const mimeType = mimeTypes[ext] || (isVideo ? 'video/mp4' : 'image/jpeg');

      // Random caption
      const caption = captions[Math.floor(Math.random() * captions.length)];

      await prisma.mediaItem.create({
        data: {
          portfolioId: portfolio.id,
          url: url,
          thumbnailUrl: thumbnailUrl,
          type: isVideo ? 'VIDEO' : 'IMAGE',
          mimeType: mimeType,
          size: 0,
          caption: caption,
          isApproved: true,
          sortOrder: i,
        },
      });
      totalCreated++;
    }

    console.log(`  ${portfolio.title}: ${albumFiles.length} images`);
  }

  console.log('\nTotal media items created:', totalCreated);

  // Verification
  console.log('\nVerification:');
  const verification = await prisma.portfolio.findMany({
    where: { vendorProfileId: omnicassion.id },
    include: { _count: { select: { mediaItems: true } } },
    orderBy: { sortOrder: 'asc' },
  });

  verification.forEach(p => {
    console.log(`  ${p.title}: ${p._count.mediaItems} items ${p.isFeatured ? '(Featured)' : ''}`);
  });

  await prisma.$disconnect();
  console.log('\nDone!');
}

recreateOmnicassionPortfolios();
