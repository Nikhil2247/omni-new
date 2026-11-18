import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ============================================================================
// VIBE QUIZ IMAGES SEED
// ============================================================================
// Four categories only (Decor, Venue, Flowers, Attire). Every photo really is
// what its category and style say it is, and is served by the web app itself
// from frontend/public/images/vibe/ (see CREDITS.md there), so the quiz never
// depends on a third-party image host.
//
// Running it replaces the whole quiz image set. Earlier answers (results) stay,
// but the picks that pointed at the removed images are cleared.
// ============================================================================

interface VibeImage {
  file: string;
  category: 'Decor' | 'Venue' | 'Flowers' | 'Attire';
  style: 'Classic' | 'Romantic' | 'Boho' | 'Rustic' | 'Modern' | 'Royal';
  tags: string[];
}

const IMAGES: VibeImage[] = [
  { file: 'decor-boho-table', category: 'Decor', style: 'Boho', tags: ['table', 'colourful', 'flowers'] },
  { file: 'decor-romantic-table', category: 'Decor', style: 'Romantic', tags: ['table', 'pastel', 'garden'] },
  { file: 'decor-classic-candles', category: 'Decor', style: 'Classic', tags: ['candles', 'roses', 'table'] },
  { file: 'decor-rustic-lawn', category: 'Decor', style: 'Rustic', tags: ['lawn', 'chairs', 'outdoor'] },
  { file: 'venue-royal-ballroom', category: 'Venue', style: 'Royal', tags: ['ballroom', 'chandeliers', 'banquet'] },
  { file: 'venue-romantic-aisle', category: 'Venue', style: 'Romantic', tags: ['aisle', 'garden', 'ceremony'] },
  { file: 'venue-modern-poolside', category: 'Venue', style: 'Modern', tags: ['poolside', 'balloons', 'outdoor'] },
  { file: 'venue-rustic-hills', category: 'Venue', style: 'Rustic', tags: ['hills', 'open-air', 'destination'] },
  { file: 'flowers-romantic-bouquet', category: 'Flowers', style: 'Romantic', tags: ['bouquet', 'blush', 'bride'] },
  { file: 'flowers-boho-arch', category: 'Flowers', style: 'Boho', tags: ['arch', 'greenery', 'drapes'] },
  { file: 'flowers-classic-roses', category: 'Flowers', style: 'Classic', tags: ['roses', 'peach', 'rings'] },
  { file: 'attire-classic-gown', category: 'Attire', style: 'Classic', tags: ['gown', 'bridal', 'lace'] },
  { file: 'attire-boho-dress', category: 'Attire', style: 'Boho', tags: ['floral-dress', 'flowy', 'outdoor'] },
  { file: 'attire-royal-veil', category: 'Attire', style: 'Royal', tags: ['veil', 'bridal', 'timeless'] },
  { file: 'attire-romantic-beach', category: 'Attire', style: 'Romantic', tags: ['veil', 'beach', 'bridal'] },
];

export async function seedVibeQuizImages(prisma: PrismaClient) {
  console.log('Seeding vibe quiz images...');

  await prisma.vibeQuizSelection.deleteMany();
  const removed = await prisma.vibeQuizImage.deleteMany();
  console.log(`  Removed ${removed.count} old image(s)`);

  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    const url = `/images/vibe/${img.file}.webp`;
    await prisma.vibeQuizImage.create({
      data: {
        url,
        thumbnailUrl: url,
        category: img.category,
        style: img.style,
        tags: [img.style.toLowerCase(), img.category.toLowerCase(), ...img.tags, 'wedding'],
        isActive: true,
        sortOrder: i,
      },
    });
  }

  console.log(`Vibe quiz images seeded! Total: ${IMAGES.length} in 4 categories`);
}

// ============================================================================
// STANDALONE EXECUTION
// ============================================================================

if (require.main === module) {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  const isAccelerate = connectionString?.startsWith('prisma://');

  const prisma = isAccelerate
    ? new PrismaClient({ log: ['info', 'warn', 'error'] })
    : new PrismaClient({
        adapter: new PrismaPg(new Pool({ connectionString })),
        log: ['info', 'warn', 'error'],
      });

  seedVibeQuizImages(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
