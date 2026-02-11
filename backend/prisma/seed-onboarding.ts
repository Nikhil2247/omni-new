// ============================================================================
// SEED ONBOARDING DATA - Vibe Quiz Images & WhatsApp Templates
// ============================================================================
// Run with: npx ts-node prisma/seed-onboarding.ts
// Or add to existing seed script
// ============================================================================

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import { randomUUID } from 'crypto'

// Load environment variables
dotenv.config()

// Initialize Prisma with PostgreSQL adapter (Prisma 7 requirement)
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function seedVibeQuizImages() {
  console.log('Seeding Vibe Quiz Images...')

  const images = [
    // Royal/Traditional
    { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400', category: 'Decor', style: 'Royal', tags: ['gold', 'traditional', 'luxury'] },
    { url: 'https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=400', category: 'Venue', style: 'Royal', tags: ['palace', 'grand', 'luxury'] },

    // Boho/Natural
    { url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400', category: 'Decor', style: 'Boho', tags: ['pastel', 'natural', 'minimalist'] },
    { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400', category: 'Venue', style: 'Boho', tags: ['garden', 'outdoor', 'natural'] },

    // Classic/Elegant
    { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400', category: 'Flowers', style: 'Classic', tags: ['white', 'elegant', 'roses'] },
    { url: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=400', category: 'Cake', style: 'Classic', tags: ['white', 'floral', 'elegant'] },

    // Beach/Tropical
    { url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400', category: 'Venue', style: 'Beach', tags: ['sunset', 'romantic', 'outdoor'] },
    { url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400', category: 'Flowers', style: 'Tropical', tags: ['colorful', 'bold', 'exotic'] },

    // Modern/Minimalist
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', category: 'Decor', style: 'Modern', tags: ['geometric', 'clean', 'minimalist'] },

    // Romantic
    { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400', category: 'Lighting', style: 'Romantic', tags: ['fairy lights', 'warm', 'intimate'] },

    // Rustic
    { url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400', category: 'Table', style: 'Rustic', tags: ['wood', 'natural', 'country'] },

    // Vintage
    { url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=400', category: 'Decor', style: 'Vintage', tags: ['antique', 'lace', 'romantic'] },
  ]

  // Delete existing images and recreate (for clean seeding)
  await prisma.vibeQuizImage.deleteMany({})

  for (let i = 0; i < images.length; i++) {
    await prisma.vibeQuizImage.create({
      data: {
        id: randomUUID(),
        ...images[i],
        sortOrder: i,
        isActive: true,
      },
    })
  }

  console.log(`✓ Created ${images.length} vibe quiz images`)
}

async function seedWhatsAppTemplates() {
  console.log('Seeding WhatsApp Templates...')

  const templates = [
    {
      name: 'Wedding Invitation',
      type: 'INVITE' as const,
      content: 'Dear {guestName}, you are cordially invited to celebrate the wedding of {coupleName} on {eventDate}. We would be honored by your presence! Please RSVP at your earliest convenience.',
      variables: ['guestName', 'coupleName', 'eventDate'],
    },
    {
      name: 'Engagement Invitation',
      type: 'INVITE' as const,
      content: 'Hi {guestName}! We are delighted to invite you to the engagement ceremony of {coupleName} on {eventDate}. Join us for this special celebration!',
      variables: ['guestName', 'coupleName', 'eventDate'],
    },
    {
      name: 'RSVP Reminder',
      type: 'REMINDER' as const,
      content: 'Hi {guestName}, just a friendly reminder about {coupleName}\'s wedding on {eventDate}. We haven\'t received your RSVP yet. Please let us know if you can make it!',
      variables: ['guestName', 'coupleName', 'eventDate'],
    },
    {
      name: 'RSVP Request',
      type: 'RSVP_REQUEST' as const,
      content: 'Hello {guestName}, we are finalizing the guest list for {coupleName}\'s wedding. Could you please confirm your attendance by {rsvpDeadline}? Reply with YES or NO.',
      variables: ['guestName', 'coupleName', 'rsvpDeadline'],
    },
    {
      name: 'Thank You Message',
      type: 'THANK_YOU' as const,
      content: 'Dear {guestName}, thank you so much for being part of our special day! Your presence and blessings made our celebration even more memorable. With love, {coupleName}',
      variables: ['guestName', 'coupleName'],
    },
    {
      name: 'Event Reminder',
      type: 'REMINDER' as const,
      content: 'Hi {guestName}! Just a reminder that {coupleName}\'s wedding is coming up on {eventDate} at {venue}. We can\'t wait to see you there!',
      variables: ['guestName', 'coupleName', 'eventDate', 'venue'],
    },
  ]

  // Delete existing templates and recreate (for clean seeding)
  await prisma.whatsAppTemplate.deleteMany({})

  for (const template of templates) {
    await prisma.whatsAppTemplate.create({
      data: {
        id: randomUUID(),
        ...template,
        isActive: true,
      },
    })
  }

  console.log(`✓ Created ${templates.length} WhatsApp templates`)
}

async function main() {
  console.log('Starting onboarding data seed...\n')

  await seedVibeQuizImages()
  await seedWhatsAppTemplates()

  console.log('\n✅ Onboarding seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
