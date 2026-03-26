// ============================================================================
// PRISMA SCRIPT - Import Venue Images for Delhi Vendors
// ============================================================================
// Imports images from Google Drive folder and assigns them to matching vendors
// Uses the same image processing logic as manual uploads:
// - Sharp for image processing
// - WebP conversion at 70% quality
// - MinIO storage
//
// Usage:
//   LOCAL FOLDER: npx ts-node prisma/scripts/import-venue-images.ts ./images/delhi-venues
//   GOOGLE DRIVE: npx ts-node prisma/scripts/import-venue-images.ts --gdrive-folder=14PE7FxaUnMZLOevVH-oVyRZtv4l_zMvj
//   DRY RUN:      npx ts-node prisma/scripts/import-venue-images.ts ./images --dry-run
// ============================================================================

import 'dotenv/config'
import { PrismaClient, VendorStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
import * as sharp from 'sharp'
import * as Minio from 'minio'
import slugify from 'slugify'

// ============================================================================
// CONFIGURATION
// ============================================================================

const IMAGE_CONFIG = {
  // Default processing settings (matches upload.service.ts)
  quality: 70,
  maxWidth: 2560,
  maxHeight: 2560,

  // Profile photo settings
  profile: {
    quality: 80,
    maxWidth: 800,
    maxHeight: 800,
  },

  // Banner settings
  banner: {
    quality: 82,
    maxWidth: 1920,
    maxHeight: 1080,
  },

  // Portfolio settings with thumbnails
  portfolio: {
    quality: 70,
    maxWidth: 2560,
    maxHeight: 2560,
    thumbnailWidth: 400,
    thumbnailHeight: 400,
  },
}

// Supported image extensions
const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.heic', '.heif', '.avif', '.tiff', '.tif', '.bmp',
]

// ============================================================================
// INITIALIZE PRISMA
// ============================================================================

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

// ============================================================================
// INITIALIZE MINIO
// ============================================================================

function createMinioClient(): Minio.Client {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
  const port = parseInt(process.env.MINIO_PORT || '9000', 10)
  const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin'
  const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin'
  const useSSL = process.env.MINIO_USE_SSL === 'true'

  return new Minio.Client({
    endPoint: endpoint,
    port,
    accessKey,
    secretKey,
    useSSL,
  })
}

const minioClient = createMinioClient()
const MINIO_BUCKET = process.env.MINIO_DEFAULT_BUCKET || 'omnicassion'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a slug from a string
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Generate a safe filename with timestamp
 */
function generateFilename(originalName: string, extension: string = 'webp'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const safeName = slugify(path.basename(originalName, path.extname(originalName)), {
    lower: true,
    strict: true,
    trim: true,
  }).substring(0, 50)

  return `${timestamp}-${random}${safeName ? `-${safeName}` : ''}.${extension}`
}

/**
 * Extract venue name from filename
 * Supports various formats:
 * - "JW Marriott New Delhi Aerocity.jpg"
 * - "jw-marriott-new-delhi-aerocity.png"
 * - "01 - JW Marriott New Delhi Aerocity.jpg"
 * - "JW_Marriott_New_Delhi_Aerocity_1.webp"
 */
function extractVenueNameFromFilename(filename: string): string {
  // Remove extension
  let name = path.basename(filename, path.extname(filename))

  // Remove leading numbers and separators (e.g., "01 - ", "1_", "01-")
  name = name.replace(/^\d+[\s_-]+/, '')

  // Remove trailing numbers (e.g., "_1", "-2", " 3")
  name = name.replace(/[\s_-]+\d+$/, '')

  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]+/g, ' ')

  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ').trim()

  return name
}

/**
 * Normalize a name for comparison (remove special chars, lowercase)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Calculate similarity score between two strings (simple)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1)
  const s2 = normalizeName(str2)

  if (s1 === s2) return 1.0

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2
    const longer = s1.length < s2.length ? s2 : s1
    return shorter.length / longer.length
  }

  // Levenshtein distance based similarity
  const distance = levenshteinDistance(s1, s2)
  const maxLen = Math.max(s1.length, s2.length)
  return maxLen > 0 ? 1 - distance / maxLen : 0
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length
  const len2 = s2.length
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Find best matching vendor for an image filename
 */
function findMatchingVendor(
  filename: string,
  vendors: Array<{ id: string; businessName: string; slug: string }>,
  threshold: number = 0.6,
): { vendor: typeof vendors[0]; score: number } | null {
  const extractedName = extractVenueNameFromFilename(filename)

  let bestMatch: { vendor: typeof vendors[0]; score: number } | null = null

  for (const vendor of vendors) {
    // Compare with business name
    const nameScore = calculateSimilarity(extractedName, vendor.businessName)

    // Compare with slug (converted to readable form)
    const slugReadable = vendor.slug.replace(/-/g, ' ')
    const slugScore = calculateSimilarity(extractedName, slugReadable)

    const score = Math.max(nameScore, slugScore)

    if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { vendor, score }
    }
  }

  return bestMatch
}

// ============================================================================
// IMAGE PROCESSING (matches upload.service.ts logic)
// ============================================================================

interface ProcessedImage {
  buffer: Buffer
  mimeType: string
  extension: string
  width?: number
  height?: number
}

/**
 * Process image: convert to WebP with specified quality and resize
 */
async function processImage(
  imageBuffer: Buffer,
  options: {
    quality?: number
    maxWidth?: number
    maxHeight?: number
  } = {},
): Promise<ProcessedImage> {
  const quality = options.quality || IMAGE_CONFIG.quality
  const maxWidth = options.maxWidth || IMAGE_CONFIG.maxWidth
  const maxHeight = options.maxHeight || IMAGE_CONFIG.maxHeight

  let sharpInstance = sharp(imageBuffer)

  // Resize if dimensions exceed max
  sharpInstance = sharpInstance.resize({
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
  })

  // Convert to WebP with specified quality
  sharpInstance = sharpInstance.webp({
    quality,
    effort: 4, // Balance between compression speed and file size
  })

  const processedBuffer = await sharpInstance.toBuffer()
  const metadata = await sharp(processedBuffer).metadata()

  return {
    buffer: processedBuffer,
    mimeType: 'image/webp',
    extension: '.webp',
    width: metadata.width,
    height: metadata.height,
  }
}

/**
 * Generate thumbnail for an image
 */
async function generateThumbnail(
  imageBuffer: Buffer,
  width: number = IMAGE_CONFIG.portfolio.thumbnailWidth,
  height: number = IMAGE_CONFIG.portfolio.thumbnailHeight,
  quality: number = IMAGE_CONFIG.quality,
): Promise<ProcessedImage> {
  const sharpInstance = sharp(imageBuffer)
    .resize({
      width,
      height,
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality })

  const thumbnailBuffer = await sharpInstance.toBuffer()
  const metadata = await sharp(thumbnailBuffer).metadata()

  return {
    buffer: thumbnailBuffer,
    mimeType: 'image/webp',
    extension: '.webp',
    width: metadata.width,
    height: metadata.height,
  }
}

// ============================================================================
// MINIO UPLOAD
// ============================================================================

/**
 * Upload buffer to MinIO
 */
async function uploadToMinio(
  objectPath: string,
  buffer: Buffer,
  contentType: string = 'image/webp',
): Promise<void> {
  await minioClient.putObject(
    MINIO_BUCKET,
    objectPath,
    buffer,
    buffer.length,
    { 'Content-Type': contentType },
  )
}

/**
 * Ensure MinIO bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  const exists = await minioClient.bucketExists(MINIO_BUCKET)
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1')
    console.log(`Created MinIO bucket: ${MINIO_BUCKET}`)
  }
}

// ============================================================================
// FILE READING (Local & Google Drive)
// ============================================================================

interface ImageFile {
  filename: string
  buffer: Buffer
  source: 'local' | 'gdrive'
}

/**
 * Read images from local directory
 */
async function readLocalImages(dirPath: string): Promise<ImageFile[]> {
  const images: ImageFile[] = []

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`)
  }

  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (SUPPORTED_EXTENSIONS.includes(ext)) {
      const filePath = path.join(dirPath, file)
      const buffer = fs.readFileSync(filePath)
      images.push({
        filename: file,
        buffer,
        source: 'local',
      })
    }
  }

  return images
}

/**
 * Download file from URL
 */
function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          return downloadFile(redirectUrl).then(resolve).catch(reject)
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: Failed to download`))
        return
      }

      const chunks: Buffer[] = []
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    }).on('error', reject)
  })
}

/**
 * List files from Google Drive folder using Drive API
 * Requires GOOGLE_API_KEY in environment
 */
async function listGoogleDriveFiles(folderId: string): Promise<Array<{ id: string; name: string }>> {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required for Google Drive access')
  }

  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType)`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { files: Array<{ id: string; name: string; mimeType: string }> }

  // Filter to only image files
  return data.files.filter(file =>
    file.mimeType.startsWith('image/') ||
    SUPPORTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
  )
}

/**
 * Download image from Google Drive
 */
async function downloadGoogleDriveFile(fileId: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required')
  }

  // Use the direct download URL for Google Drive
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`

  return downloadFile(url)
}

/**
 * Read images from Google Drive folder
 */
async function readGoogleDriveImages(folderId: string): Promise<ImageFile[]> {
  console.log(`Fetching file list from Google Drive folder: ${folderId}`)

  const files = await listGoogleDriveFiles(folderId)
  console.log(`Found ${files.length} image files in Google Drive folder`)

  const images: ImageFile[] = []

  for (const file of files) {
    try {
      console.log(`  Downloading: ${file.name}...`)
      const buffer = await downloadGoogleDriveFile(file.id)
      images.push({
        filename: file.name,
        buffer,
        source: 'gdrive',
      })
    } catch (error) {
      console.error(`  Failed to download ${file.name}:`, error)
    }
  }

  return images
}

// ============================================================================
// STORAGE PATH HELPERS (matches storage-path.helper.ts)
// ============================================================================

function vendorProfilePhotoPath(vendorSlug: string, originalName: string): string {
  const slug = slugify(vendorSlug, { lower: true, strict: true, trim: true }) || 'unknown'
  const filename = generateFilename(originalName, 'webp')
  return `vendors/${slug}/profile/${filename}`
}

function vendorBannerPath(vendorSlug: string, originalName: string): string {
  const slug = slugify(vendorSlug, { lower: true, strict: true, trim: true }) || 'unknown'
  const filename = generateFilename(originalName, 'webp')
  return `vendors/${slug}/banner/${filename}`
}

function vendorPortfolioPath(vendorSlug: string, originalName: string): string {
  const slug = slugify(vendorSlug, { lower: true, strict: true, trim: true }) || 'unknown'
  const filename = generateFilename(originalName, 'webp')
  return `vendors/${slug}/portfolio/${filename}`
}

function vendorPortfolioThumbnailPath(vendorSlug: string, originalName: string): string {
  const slug = slugify(vendorSlug, { lower: true, strict: true, trim: true }) || 'unknown'
  const filename = generateFilename(originalName, 'webp')
  return `vendors/${slug}/portfolio/thumbnails/thumb-${filename}`
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

interface ImportOptions {
  source: 'local' | 'gdrive'
  path: string // Local directory path or Google Drive folder ID
  dryRun: boolean
  imageType: 'profile' | 'banner' | 'portfolio' | 'both' // 'both' = profile + banner
  matchThreshold: number
  city?: string // Filter vendors by city
}

interface ImportResult {
  total: number
  matched: number
  uploaded: number
  failed: number
  skipped: number
  details: Array<{
    filename: string
    vendorName?: string
    vendorSlug?: string
    score?: number
    status: 'matched' | 'uploaded' | 'failed' | 'skipped' | 'no-match'
    error?: string
  }>
}

async function importVenueImages(options: ImportOptions): Promise<ImportResult> {
  const result: ImportResult = {
    total: 0,
    matched: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  }

  console.log('\n========================================')
  console.log('Venue Image Import Script')
  console.log('========================================')
  console.log(`Source: ${options.source}`)
  console.log(`Path: ${options.path}`)
  console.log(`Image Type: ${options.imageType}`)
  console.log(`Match Threshold: ${options.matchThreshold}`)
  console.log(`Dry Run: ${options.dryRun}`)
  if (options.city) console.log(`City Filter: ${options.city}`)
  console.log('========================================\n')

  // Step 1: Ensure MinIO bucket exists
  if (!options.dryRun) {
    await ensureBucketExists()
  }

  // Step 2: Fetch vendors from database
  console.log('Fetching vendors from database...')

  const whereClause: any = {
    status: { in: [VendorStatus.UNCLAIMED, VendorStatus.ACTIVE] },
  }

  // If city filter is specified, filter by city
  if (options.city) {
    whereClause.address = {
      city: {
        name: { contains: options.city, mode: 'insensitive' },
      },
    }
  }

  const vendors = await prisma.vendorProfile.findMany({
    where: whereClause,
    select: {
      id: true,
      businessName: true,
      slug: true,
      profilePhotoUrl: true,
      bannerImageUrl: true,
      address: {
        select: {
          city: {
            select: { name: true },
          },
        },
      },
    },
  })

  console.log(`Found ${vendors.length} vendors\n`)

  if (vendors.length === 0) {
    console.log('No vendors found matching criteria. Exiting.')
    return result
  }

  // Step 3: Read images
  console.log('Reading images...')
  let images: ImageFile[]

  if (options.source === 'gdrive') {
    images = await readGoogleDriveImages(options.path)
  } else {
    images = await readLocalImages(options.path)
  }

  result.total = images.length
  console.log(`Found ${images.length} images\n`)

  if (images.length === 0) {
    console.log('No images found. Exiting.')
    return result
  }

  // Step 4: Process each image
  console.log('Processing images...\n')

  // Track which vendors already have profile/banner set (to only upload one image each)
  const vendorsWithProfile = new Set<string>()
  const vendorsWithBanner = new Set<string>()

  for (const image of images) {
    const detail: typeof result.details[0] = {
      filename: image.filename,
      status: 'no-match',
    }

    try {
      // Find matching vendor
      const match = findMatchingVendor(image.filename, vendors, options.matchThreshold)

      if (!match) {
        console.log(`  ✗ No match: ${image.filename}`)
        result.skipped++
        detail.status = 'no-match'
        result.details.push(detail)
        continue
      }

      detail.vendorName = match.vendor.businessName
      detail.vendorSlug = match.vendor.slug
      detail.score = match.score

      console.log(`  ✓ Matched: ${image.filename}`)
      console.log(`    → Vendor: ${match.vendor.businessName} (score: ${(match.score * 100).toFixed(1)}%)`)

      result.matched++

      if (options.dryRun) {
        detail.status = 'matched'
        result.details.push(detail)
        continue
      }

      // Process and upload images based on imageType
      const uploads: Array<{ type: string; path: string; updateField: string }> = []

      // Only add profile if this vendor doesn't have one yet (first image wins)
      if (options.imageType === 'profile' || options.imageType === 'both') {
        if (!vendorsWithProfile.has(match.vendor.id)) {
          const profilePath = vendorProfilePhotoPath(match.vendor.slug, image.filename)
          uploads.push({ type: 'profile', path: profilePath, updateField: 'profilePhotoUrl' })
          vendorsWithProfile.add(match.vendor.id)
        } else {
          console.log(`    ⏭️  Skipping profile (already set for this vendor)`)
        }
      }

      // Only add banner if this vendor doesn't have one yet (first image wins)
      if (options.imageType === 'banner' || options.imageType === 'both') {
        if (!vendorsWithBanner.has(match.vendor.id)) {
          const bannerPath = vendorBannerPath(match.vendor.slug, image.filename)
          uploads.push({ type: 'banner', path: bannerPath, updateField: 'bannerImageUrl' })
          vendorsWithBanner.add(match.vendor.id)
        } else {
          console.log(`    ⏭️  Skipping banner (already set for this vendor)`)
        }
      }

      // Portfolio: add all images (no limit)
      if (options.imageType === 'portfolio') {
        const portfolioPath = vendorPortfolioPath(match.vendor.slug, image.filename)
        uploads.push({ type: 'portfolio', path: portfolioPath, updateField: '' })
      }

      // If no uploads needed (profile/banner already set), skip this image
      if (uploads.length === 0) {
        result.skipped++
        detail.status = 'skipped'
        result.details.push(detail)
        continue
      }

      // Process the image based on type
      for (const upload of uploads) {
        let processed: ProcessedImage
        let config: typeof IMAGE_CONFIG.profile

        if (upload.type === 'profile') {
          config = IMAGE_CONFIG.profile
        } else if (upload.type === 'banner') {
          config = IMAGE_CONFIG.banner
        } else {
          config = IMAGE_CONFIG.portfolio
        }

        processed = await processImage(image.buffer, {
          quality: config.quality,
          maxWidth: config.maxWidth,
          maxHeight: config.maxHeight,
        })

        // Upload to MinIO
        await uploadToMinio(upload.path, processed.buffer, processed.mimeType)
        console.log(`    📤 Uploaded ${upload.type}: ${upload.path}`)

        // Update vendor profile in database
        if (upload.updateField) {
          await prisma.vendorProfile.update({
            where: { id: match.vendor.id },
            data: { [upload.updateField]: upload.path },
          })
          console.log(`    📝 Updated vendor ${upload.updateField}`)
        }

        // For portfolio, create portfolio entry with media item
        if (upload.type === 'portfolio') {
          // Generate thumbnail
          const thumbnail = await generateThumbnail(image.buffer)
          const thumbnailPath = vendorPortfolioThumbnailPath(match.vendor.slug, image.filename)
          await uploadToMinio(thumbnailPath, thumbnail.buffer, thumbnail.mimeType)
          console.log(`    📤 Uploaded thumbnail: ${thumbnailPath}`)

          // Check if vendor has a default portfolio, create one if not
          let portfolio = await prisma.portfolio.findFirst({
            where: { vendorProfileId: match.vendor.id },
            orderBy: { sortOrder: 'asc' },
          })

          if (!portfolio) {
            portfolio = await prisma.portfolio.create({
              data: {
                vendorProfileId: match.vendor.id,
                title: 'Gallery',
                description: 'Venue photos and highlights',
                sortOrder: 0,
                isFeatured: true,
              },
            })
            console.log(`    📁 Created portfolio: ${portfolio.title}`)
          }

          // Add media item to portfolio
          await prisma.mediaItem.create({
            data: {
              portfolioId: portfolio.id,
              type: 'IMAGE',
              url: upload.path,
              thumbnailUrl: thumbnailPath,
              width: processed.width,
              height: processed.height,
              size: processed.buffer.length,
              mimeType: processed.mimeType,
              altText: `${match.vendor.businessName} venue photo`,
              sortOrder: 0,
              isApproved: true,
            },
          })
          console.log(`    🖼️  Added media item to portfolio`)
        }
      }

      result.uploaded++
      detail.status = 'uploaded'
      result.details.push(detail)

    } catch (error) {
      console.error(`  ✗ Failed: ${image.filename}`)
      console.error(`    Error: ${error}`)
      result.failed++
      detail.status = 'failed'
      detail.error = String(error)
      result.details.push(detail)
    }
  }

  return result
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)

  const options: ImportOptions = {
    source: 'local',
    path: '',
    dryRun: false,
    imageType: 'both',
    matchThreshold: 0.6,
  }

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else if (arg.startsWith('--gdrive-folder=')) {
      options.source = 'gdrive'
      options.path = arg.split('=')[1]
    } else if (arg.startsWith('--type=')) {
      const type = arg.split('=')[1] as ImportOptions['imageType']
      if (['profile', 'banner', 'portfolio', 'both'].includes(type)) {
        options.imageType = type
      }
    } else if (arg.startsWith('--threshold=')) {
      options.matchThreshold = parseFloat(arg.split('=')[1])
    } else if (arg.startsWith('--city=')) {
      options.city = arg.split('=')[1]
    } else if (!arg.startsWith('--')) {
      options.path = arg
      options.source = 'local'
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
Venue Image Import Script
=========================

Imports images and matches them to existing vendors by name.

USAGE:
  npx ts-node prisma/scripts/import-venue-images.ts <path> [options]
  npx ts-node prisma/scripts/import-venue-images.ts --gdrive-folder=<folder-id> [options]

ARGUMENTS:
  <path>                    Local directory containing images

OPTIONS:
  --gdrive-folder=<id>      Google Drive folder ID (requires GOOGLE_API_KEY env var)
  --type=<type>             Image type: profile, banner, portfolio, or both (default: both)
  --threshold=<0.0-1.0>     Match threshold (default: 0.6)
  --city=<name>             Filter vendors by city name
  --dry-run                 Show matches without uploading
  --help, -h                Show this help message

EXAMPLES:
  # Import from local folder
  npx ts-node prisma/scripts/import-venue-images.ts ./images/delhi-venues

  # Import from Google Drive
  npx ts-node prisma/scripts/import-venue-images.ts --gdrive-folder=14PE7FxaUnMZLOevVH-oVyRZtv4l_zMvj

  # Dry run to test matching
  npx ts-node prisma/scripts/import-venue-images.ts ./images --dry-run

  # Import only profile photos for Delhi vendors
  npx ts-node prisma/scripts/import-venue-images.ts ./images --type=profile --city="New Delhi"

ENVIRONMENT VARIABLES:
  DATABASE_URL              PostgreSQL connection string
  MINIO_ENDPOINT            MinIO server endpoint (default: localhost)
  MINIO_PORT                MinIO server port (default: 9000)
  MINIO_ACCESS_KEY          MinIO access key (default: minioadmin)
  MINIO_SECRET_KEY          MinIO secret key (default: minioadmin)
  MINIO_DEFAULT_BUCKET      MinIO bucket name (default: omnicassion)
  GOOGLE_API_KEY            Google API key (required for Google Drive access)

IMAGE NAMING CONVENTION:
  Images should be named with the venue/vendor name. The script will attempt to match:
  - "JW Marriott New Delhi Aerocity.jpg"
  - "jw-marriott-new-delhi-aerocity.png"
  - "01 - JW Marriott New Delhi Aerocity.jpg"
  - "JW_Marriott_New_Delhi_Aerocity_1.webp"
`)
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs()

  if (!options.path) {
    console.error('Error: No path specified')
    console.log('Run with --help for usage information')
    process.exit(1)
  }

  try {
    const result = await importVenueImages(options)

    // Print summary
    console.log('\n========================================')
    console.log('IMPORT SUMMARY')
    console.log('========================================')
    console.log(`Total Images: ${result.total}`)
    console.log(`Matched:      ${result.matched}`)
    console.log(`Uploaded:     ${result.uploaded}`)
    console.log(`Failed:       ${result.failed}`)
    console.log(`No Match:     ${result.skipped}`)
    console.log('========================================')

    // Print details for matched/uploaded images
    if (result.details.length > 0) {
      console.log('\nDETAILS:')
      console.log('--------')

      for (const detail of result.details) {
        const statusIcon = {
          'matched': '🔍',
          'uploaded': '✅',
          'failed': '❌',
          'skipped': '⏭️',
          'no-match': '❓',
        }[detail.status]

        if (detail.vendorName) {
          console.log(`${statusIcon} ${detail.filename}`)
          console.log(`   → ${detail.vendorName} (${(detail.score! * 100).toFixed(1)}% match)`)
          if (detail.error) {
            console.log(`   Error: ${detail.error}`)
          }
        } else {
          console.log(`${statusIcon} ${detail.filename} - No matching vendor found`)
        }
      }
    }

    // Exit with error code if there were failures
    if (result.failed > 0) {
      process.exit(1)
    }

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nPrisma disconnected. Script completed.')
  })
