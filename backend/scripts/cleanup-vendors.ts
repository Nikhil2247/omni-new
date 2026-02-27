/**
 * Script to update vendor categories and profile photos:
 * 1. Update/create categories with correct names
 * 2. Map specific vendors to correct categories
 * 3. Update vendor profile photos from first portfolio media item
 *
 * NOTE: This script does NOT delete any vendors or categories
 *
 * Run with: npx ts-node scripts/cleanup-vendors.ts
 * Or with dry-run: npx ts-node scripts/cleanup-vendors.ts --dry-run
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

// Target categories (name -> slug)
const TARGET_CATEGORIES = [
  { name: 'Venue', slug: 'venue' },
  { name: 'Entertainment', slug: 'entertainment' },
  { name: 'Photo & Videography', slug: 'photo-videography' },
  { name: 'Food & Catering', slug: 'food-catering' },
  { name: 'Planners', slug: 'planners' },
  { name: 'Decor & Design', slug: 'decor-design' },
  { name: 'Audio & Visual', slug: 'audio-visual' },
  { name: 'Hospitality', slug: 'hospitality' },
]

// Vendor to category mapping (vendor business name -> category slug)
const VENDOR_CATEGORY_MAP: Record<string, string> = {
  'ramola catering': 'food-catering',
  'dev tent services': 'decor-design',
  'hari chand tent': 'decor-design',
  'shiva catering': 'food-catering',
  'gourmet catering': 'food-catering',
  'ramji catering': 'food-catering',
  'rawat portrait': 'photo-videography',
  'vikas tent': 'decor-design',
  'party plan it': 'planners',
  'priya uphadaya': 'planners',
  'mystique gala': 'planners',
  'gcb chaat service': 'food-catering',
  'maharaja dj and maharana band': 'entertainment',
  'awaz eklawaya': 'entertainment',
  'fresh flower decor': 'decor-design',
  'prince flower decorator': 'decor-design',
  'dj ammy': 'entertainment',
}

// Normalize vendor names for comparison (lowercase, trim whitespace)
const normalizeVendorName = (name: string): string => {
  return name.toLowerCase().trim()
}

async function updateVendors() {
  const isDryRun = process.argv.includes('--dry-run')

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  try {
    console.log('📋 Starting vendor update process...\n')

    // Step 1: Create/Update categories
    console.log('📁 Setting up categories...')
    const categoryMap: Record<string, string> = {} // slug -> id

    for (const cat of TARGET_CATEGORIES) {
      const existing = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: cat.slug },
            { name: { equals: cat.name, mode: 'insensitive' } },
          ],
        },
      })

      if (existing) {
        // Update existing category name if different
        if (existing.name !== cat.name || existing.slug !== cat.slug) {
          if (!isDryRun) {
            await prisma.category.update({
              where: { id: existing.id },
              data: { name: cat.name, slug: cat.slug },
            })
          }
          console.log(`   📝 Updated category: "${existing.name}" -> "${cat.name}"`)
        } else {
          console.log(`   ✅ Category exists: "${cat.name}"`)
        }
        categoryMap[cat.slug] = existing.id
      } else {
        // Create new category
        if (!isDryRun) {
          const newCat = await prisma.category.create({
            data: {
              name: cat.name,
              slug: cat.slug,
              isActive: true,
            },
          })
          categoryMap[cat.slug] = newCat.id
        }
        console.log(`   ➕ Created category: "${cat.name}"`)
      }
    }

    // Refresh category map after potential creates
    if (!isDryRun) {
      const allCats = await prisma.category.findMany({
        where: { slug: { in: TARGET_CATEGORIES.map(c => c.slug) } },
      })
      for (const c of allCats) {
        categoryMap[c.slug] = c.id
      }
    }

    // Step 2: Get all vendors
    const allVendors = await prisma.vendorProfile.findMany({
      select: {
        id: true,
        businessName: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
        portfolios: {
          select: {
            mediaItems: {
              select: {
                url: true,
              },
              where: { isApproved: true },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              take: 1,
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    console.log(`\n📊 Total vendors in database: ${allVendors.length}`)

    // Step 3: Map vendors to correct categories
    console.log('\n🏷️ Mapping vendors to categories...')
    let categoryUpdateCount = 0

    for (const vendor of allVendors) {
      const normalizedName = normalizeVendorName(vendor.businessName)
      const targetCategorySlug = VENDOR_CATEGORY_MAP[normalizedName]

      if (targetCategorySlug && categoryMap[targetCategorySlug]) {
        const newCategoryId = categoryMap[targetCategorySlug]

        if (vendor.categoryId !== newCategoryId) {
          if (isDryRun) {
            const targetCat = TARGET_CATEGORIES.find(c => c.slug === targetCategorySlug)
            console.log(`   🏷️ Would map "${vendor.businessName}" to "${targetCat?.name}"`)
          } else {
            await prisma.vendorProfile.update({
              where: { id: vendor.id },
              data: { categoryId: newCategoryId },
              select: { id: true },
            })
            const targetCat = TARGET_CATEGORIES.find(c => c.slug === targetCategorySlug)
            console.log(`   🏷️ Mapped "${vendor.businessName}" to "${targetCat?.name}"`)
          }
          categoryUpdateCount++
        } else {
          console.log(`   ✅ "${vendor.businessName}" already in correct category`)
        }
      } else {
        // Vendor not in mapping list - keep current category
        console.log(`   ⏭️ "${vendor.businessName}" - keeping current category: ${vendor.category?.name || 'none'}`)
      }
    }

    console.log(`\n📊 Category mapping summary: ${categoryUpdateCount} vendors updated`)

    // Step 4: Update vendors with profile photo from first portfolio item
    console.log('\n🖼️ Updating profile photos from portfolio items...')

    let updatedCount = 0
    let skippedCount = 0

    for (const vendor of allVendors) {
      const firstMediaItem = vendor.portfolios.find(portfolio => portfolio.mediaItems.length > 0)?.mediaItems[0]

      if (firstMediaItem && firstMediaItem.url) {
        if (isDryRun) {
          console.log(`   📸 Would update "${vendor.businessName}" profile photo to: ${firstMediaItem.url.substring(0, 50)}...`)
          updatedCount++
        } else {
          await prisma.vendorProfile.update({
            where: { id: vendor.id },
            data: { profilePhotoUrl: firstMediaItem.url },
            select: { id: true },
          })
          console.log(`   📸 Updated "${vendor.businessName}" profile photo`)
          updatedCount++
        }
      } else {
        console.log(`   ⏭️ Skipped "${vendor.businessName}" - no portfolio media items`)
        skippedCount++
      }
    }

    console.log(`\n📊 Profile photo update summary:`)
    console.log(`   - Updated: ${updatedCount}`)
    console.log(`   - Skipped (no media): ${skippedCount}`)

    console.log('\n✅ Vendor update completed!')

    if (isDryRun) {
      console.log('\n⚠️ This was a DRY RUN. Run without --dry-run to apply changes.')
    }

  } catch (error) {
    console.error('❌ Error during update:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateVendors()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
