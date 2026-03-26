// ============================================================================
// PRISMA SCRIPT - Import Vendors as UNCLAIMED with PUBLIC Plan
// ============================================================================
// Generic vendor import script that works with any city/category.
// Reads vendor data from CSV or JSON files.
//
// Usage:
//   npx ts-node prisma/scripts/import-vendors.ts <file-path> [--category=<slug>]
//
// Examples:
//   npx ts-node prisma/scripts/import-vendors.ts ./data/delhi-venues.csv
//   npx ts-node prisma/scripts/import-vendors.ts ./data/mumbai-photographers.json --category=photography
//   npx ts-node prisma/scripts/import-vendors.ts ./data/bangalore-caterers.csv --category=catering
//
// File formats supported: .csv, .json
// See sample templates in prisma/scripts/templates/
// ============================================================================

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient, VendorStatus, SubscriptionStatus, BillingCycle, PlanTier } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Initialize Prisma with adapter
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

// ============================================================================
// TYPES
// ============================================================================

interface VendorData {
  businessName: string
  description: string
  location: string        // Address line 1
  services?: string       // Tagline/services offered
  city: string
  state?: string
  country?: string
  postalCode?: string
  email?: string
  phone?: string
  website?: string
  coverImage?: string
  category?: string       // Category slug override (optional)
}

interface ImportOptions {
  filePath: string
  categorySlug?: string
  dryRun?: boolean
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseCSV(content: string): VendorData[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row')
  }

  // Parse header - handle quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''))

  // Map common header variations to standard fields
  const headerMap: Record<string, string> = {
    'venuename': 'businessName',
    'businessname': 'businessName',
    'name': 'businessName',
    'vendorname': 'businessName',
    'description': 'description',
    'desc': 'description',
    'location': 'location',
    'address': 'location',
    'addressline1': 'location',
    'service': 'services',
    'services': 'services',
    'tagline': 'services',
    'city': 'city',
    'state': 'state',
    'province': 'state',
    'country': 'country',
    'postalcode': 'postalCode',
    'zipcode': 'postalCode',
    'zip': 'postalCode',
    'pincode': 'postalCode',
    'email': 'email',
    'contactemail': 'email',
    'phone': 'phone',
    'contactphone': 'phone',
    'mobile': 'phone',
    'website': 'website',
    'url': 'website',
    'coverimage': 'coverImage',
    'image': 'coverImage',
    'photo': 'coverImage',
    'imageurl': 'coverImage',
    'category': 'category',
    'categoryslug': 'category',
  }

  const vendors: VendorData[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || values.every(v => !v)) continue

    const vendor: Partial<VendorData> = {}

    headers.forEach((header, index) => {
      const standardField = headerMap[header] || header
      const value = values[index]?.trim()
      if (value) {
        (vendor as any)[standardField] = value
      }
    })

    // Validate required fields
    if (vendor.businessName && vendor.city) {
      vendors.push(vendor as VendorData)
    } else {
      console.warn(`  Warning: Skipping row ${i + 1} - missing required fields (businessName, city)`)
    }
  }

  return vendors
}

function parseJSON(content: string): VendorData[] {
  const data = JSON.parse(content)

  // Handle both array and object with vendors property
  const vendors = Array.isArray(data) ? data : data.vendors || []

  // Validate and normalize
  return vendors.filter((v: any) => {
    if (!v.businessName && !v.name && !v.venueName) {
      console.warn('  Warning: Skipping entry - missing business name')
      return false
    }
    if (!v.city) {
      console.warn(`  Warning: Skipping ${v.businessName || v.name} - missing city`)
      return false
    }
    return true
  }).map((v: any) => ({
    businessName: v.businessName || v.name || v.venueName,
    description: v.description || v.desc || '',
    location: v.location || v.address || v.addressLine1 || '',
    services: v.services || v.service || v.tagline || '',
    city: v.city,
    state: v.state || v.province || '',
    country: v.country || 'India',
    postalCode: v.postalCode || v.zipCode || v.pincode || '',
    email: v.email || v.contactEmail || '',
    phone: v.phone || v.contactPhone || v.mobile || '',
    website: v.website || v.url || '',
    coverImage: v.coverImage || v.image || v.imageUrl || '',
    category: v.category || v.categorySlug || '',
  }))
}

function loadVendorData(filePath: string): VendorData[] {
  const absolutePath = path.resolve(filePath)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`)
  }

  const content = fs.readFileSync(absolutePath, 'utf-8')
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.csv':
      return parseCSV(content)
    case '.json':
      return parseJSON(content)
    default:
      throw new Error(`Unsupported file format: ${ext}. Use .csv or .json`)
  }
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Usage: npx ts-node prisma/scripts/import-vendors.ts <file-path> [options]

Options:
  --category=<slug>   Category slug to use for all vendors (e.g., venues, photography)
  --dry-run           Preview what would be imported without making changes

Examples:
  npx ts-node prisma/scripts/import-vendors.ts ./data/delhi-venues.csv
  npx ts-node prisma/scripts/import-vendors.ts ./data/venues.json --category=venues
  npx ts-node prisma/scripts/import-vendors.ts ./data/mumbai.csv --dry-run

CSV Format (header row required):
  businessName,description,location,services,city,state,email,phone,website,coverImage

JSON Format:
  [{ "businessName": "...", "city": "...", ... }]
  or
  { "vendors": [{ "businessName": "...", "city": "...", ... }] }
`)
    process.exit(0)
  }

  const options: ImportOptions = {
    filePath: '',
    dryRun: false,
  }

  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      options.categorySlug = arg.split('=')[1]
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (!arg.startsWith('--')) {
      options.filePath = arg
    }
  }

  if (!options.filePath) {
    throw new Error('File path is required')
  }

  return options
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function importVendors(options: ImportOptions) {
  console.log('========================================')
  console.log('Vendor Import Script - UNCLAIMED + PUBLIC Plan')
  console.log('========================================\n')

  if (options.dryRun) {
    console.log('*** DRY RUN MODE - No changes will be made ***\n')
  }

  try {
    // Step 1: Load vendor data from file
    console.log(`Loading data from: ${options.filePath}`)
    const vendors = loadVendorData(options.filePath)
    console.log(`Found ${vendors.length} vendor(s) to import\n`)

    if (vendors.length === 0) {
      console.log('No vendors to import. Check your file format.')
      return
    }

    // Step 2: Get default category if specified
    let defaultCategory: { id: string; name: string; slug: string } | null = null

    if (options.categorySlug) {
      defaultCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: options.categorySlug },
            { name: { equals: options.categorySlug, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true },
      })

      if (!defaultCategory) {
        console.error(`ERROR: Category '${options.categorySlug}' not found!`)
        console.log('\nAvailable categories:')
        const categories = await prisma.category.findMany({
          where: { parentId: null },
          select: { name: true, slug: true },
          orderBy: { name: 'asc' },
        })
        categories.forEach(c => console.log(`  - ${c.slug} (${c.name})`))
        return
      }
      console.log(`Default category: ${defaultCategory.name} (${defaultCategory.slug})`)
    }

    // Step 3: Find the PUBLIC vendor plan
    const publicPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: 'vendor-public' },
      include: {
        prices: {
          where: {
            currency: 'INR',
            billingCycle: BillingCycle.MONTHLY,
          },
          take: 1,
        },
      },
    })

    if (!publicPlan) {
      console.error('ERROR: PUBLIC vendor plan (vendor-public) not found!')
      console.log('Please run the subscription plans seed first:')
      console.log('  npx ts-node prisma/seeds/subscription-plans.seed.ts')
      return
    }

    const publicPrice = publicPlan.prices[0]
    if (!publicPrice) {
      console.error('ERROR: PUBLIC plan price not found!')
      return
    }

    console.log(`Using plan: ${publicPlan.name} (ID: ${publicPlan.id})\n`)

    // Step 4: Get all available categories for lookup
    const allCategories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    })
    const categoryMap = new Map(allCategories.map(c => [c.slug.toLowerCase(), c]))

    // Also map by name for flexibility
    allCategories.forEach(c => {
      categoryMap.set(c.name.toLowerCase(), c)
    })

    // Step 5: Process each vendor
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    console.log('Processing vendors...\n')

    for (const vendor of vendors) {
      const slug = generateSlug(vendor.businessName)

      try {
        // Determine category for this vendor
        let category = defaultCategory

        if (vendor.category) {
          const vendorCategory = categoryMap.get(vendor.category.toLowerCase())
          if (vendorCategory) {
            category = vendorCategory
          } else {
            console.warn(`  Warning: Category '${vendor.category}' not found for ${vendor.businessName}, using default`)
          }
        }

        if (!category) {
          // Try to find venues as fallback
          category = categoryMap.get('venues') || allCategories[0]
          if (!category) {
            console.error(`  x Failed: ${vendor.businessName} - No category available`)
            errorCount++
            continue
          }
        }

        // Check if vendor already exists by slug
        const existingBySlug = await prisma.vendorProfile.findUnique({
          where: { slug },
        })

        if (existingBySlug) {
          console.log(`  - Skipped (slug exists): ${vendor.businessName}`)
          skippedCount++
          continue
        }

        // Check if vendor already exists by business name + city combination
        const existingByNameCity = await prisma.vendorProfile.findFirst({
          where: {
            businessName: { equals: vendor.businessName, mode: 'insensitive' },
            address: {
              city: {
                name: { equals: vendor.city, mode: 'insensitive' },
              },
            },
          },
        })

        if (existingByNameCity) {
          console.log(`  - Skipped (name+city exists): ${vendor.businessName} in ${vendor.city}`)
          skippedCount++
          continue
        }

        // Check if vendor exists by email (if provided and valid)
        const invalidEmails = ['not available', 'n/a', 'na', 'none', '-', '']
        const isValidEmail = vendor.email &&
          !invalidEmails.includes(vendor.email.toLowerCase().trim()) &&
          vendor.email.includes('@')

        if (isValidEmail) {
          const existingByEmail = await prisma.vendorProfile.findFirst({
            where: {
              contactEmail: { equals: vendor.email, mode: 'insensitive' },
            },
          })

          if (existingByEmail) {
            console.log(`  - Skipped (email exists): ${vendor.businessName} (${vendor.email})`)
            skippedCount++
            continue
          }
        }

        // Check if vendor exists by phone (if provided and valid)
        const invalidPhones = ['not available', 'n/a', 'na', 'none', '-', '']
        const isValidPhone = vendor.phone &&
          !invalidPhones.includes(vendor.phone.toLowerCase().trim()) &&
          vendor.phone.replace(/\D/g, '').length >= 10

        if (isValidPhone && vendor.phone) {
          const normalizedPhone = vendor.phone.replace(/[\s\-\(\)]/g, '')
          const existingByPhone = await prisma.vendorProfile.findFirst({
            where: {
              contactPhone: { contains: normalizedPhone.slice(-10) }, // Last 10 digits
            },
          })

          if (existingByPhone) {
            console.log(`  - Skipped (phone exists): ${vendor.businessName} (${vendor.phone})`)
            skippedCount++
            continue
          }
        }

        if (options.dryRun) {
          console.log(`  [DRY RUN] Would create: ${vendor.businessName} | City: ${vendor.city} | Category: ${category.name}`)
          successCount++
          continue
        }

        await prisma.$transaction(async (tx) => {
          // Find or create city
          let city = await tx.city.findFirst({
            where: {
              name: { equals: vendor.city, mode: 'insensitive' },
            },
          })

          if (!city) {
            // Find or create state first
            let state = await tx.state.findFirst({
              where: {
                name: { equals: vendor.state || 'Delhi', mode: 'insensitive' },
              },
            })

            if (!state) {
              // Find country first
              let country = await tx.country.findFirst({
                where: {
                  name: { equals: vendor.country || 'India', mode: 'insensitive' },
                },
              })

              if (!country) {
                country = await tx.country.create({
                  data: {
                    name: vendor.country || 'India',
                    code: 'IND',
                    code2: 'IN',
                    dialCode: '+91',
                    currency: 'INR',
                  },
                })
              }

              state = await tx.state.create({
                data: {
                  name: vendor.state || 'Delhi',
                  countryId: country.id,
                },
              })
            }

            city = await tx.city.create({
              data: {
                name: vendor.city,
                stateId: state.id,
              },
            })
          }

          // Create address
          const address = await tx.address.create({
            data: {
              addressLine1: vendor.location || vendor.city,
              cityId: city.id,
              postalCode: vendor.postalCode || '',
            },
          })

          // Create vendor profile
          const vendorProfile = await tx.vendorProfile.create({
            data: {
              businessName: vendor.businessName,
              slug,
              description: vendor.description || '',
              tagline: vendor.description || '',
              categoryId: category!.id,
              addressId: address.id,
              contactEmail: vendor.email || '',
              contactPhone: vendor.phone || '',
              website: vendor.website || '',
              bannerImageUrl: vendor.coverImage || '',
              profilePhotoUrl: vendor.coverImage || '',
              status: VendorStatus.UNCLAIMED,
              planTier: PlanTier.PUBLIC,
              userId: null,
              leadCount: 0,
              viewCount: 0,
              totalReviews: 0,
              adCredits: 0,
              searchBoost: 0,
            },
          })

          // Create PUBLIC subscription
          await tx.subscription.create({
            data: {
              vendorProfileId: vendorProfile.id,
              planId: publicPlan.id,
              priceId: publicPrice.id,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
              cancelAtPeriodEnd: false,
            },
          })

          console.log(`  + Created: ${vendor.businessName} | ${vendor.city} | ${category!.name}`)
        })

        successCount++
      } catch (error) {
        console.error(`  x Failed: ${vendor.businessName} - ${error}`)
        errorCount++
      }
    }

    // Summary
    console.log('\n========================================')
    console.log('IMPORT SUMMARY')
    console.log('========================================')
    if (options.dryRun) {
      console.log(`Would import: ${successCount} vendor(s)`)
    } else {
      console.log(`Successfully imported: ${successCount} vendor(s)`)
    }
    if (skippedCount > 0) {
      console.log(`Skipped (already exist): ${skippedCount} vendor(s)`)
    }
    if (errorCount > 0) {
      console.log(`Failed: ${errorCount} vendor(s)`)
    }
    console.log('========================================')

  } catch (error) {
    console.error('Error importing vendors:', error)
    throw error
  }
}

// ============================================================================
// EXECUTE
// ============================================================================

const options = parseArgs()

importVendors(options)
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nPrisma disconnected. Script completed.')
  })
