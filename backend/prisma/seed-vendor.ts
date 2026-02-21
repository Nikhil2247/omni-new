import 'dotenv/config'
import {
  PrismaClient,
  UserStatus,
  VendorStatus,
  CatalogMediaType,
} from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'
import * as Minio from 'minio'
import slugify from 'slugify'

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
const isAccelerate = connectionString?.startsWith('prisma://')

const prisma = isAccelerate
  ? new PrismaClient({ log: ['info', 'warn', 'error'] })
  : new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString })),
      log: ['info', 'warn', 'error'],
    })

const vendorEmail = process.env.VENDOR_EMAIL || 'omnicassion@gmail.com'
const vendorPassword = process.env.VENDOR_PASSWORD || 'Omni@0106'
const vendorFirstName = process.env.VENDOR_FIRST_NAME || 'Omnicassion'
const vendorLastName = process.env.VENDOR_LAST_NAME || 'Vendor'
const businessName = process.env.VENDOR_BUSINESS_NAME || 'Omnicassion Studio'
const portfolioTitle = process.env.VENDOR_PORTFOLIO_TITLE || 'Featured Portfolio'
const requestedCategorySlug = process.env.VENDOR_CATEGORY_SLUG

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost'
const minioPort = Number(process.env.MINIO_PORT || 9000)
const minioUseSSL = `${process.env.MINIO_USE_SSL || 'false'}`.toLowerCase() === 'true'
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin'
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadmin'
const minioBucket = process.env.MINIO_DEFAULT_BUCKET || process.env.MINIO_BUCKET || 'omnicassion'

const minioPublicUrl = (process.env.MINIO_PUBLIC_URL || '').replace(/\/+$/, '')

const PROFILE_PREFIXES = ['vendor-profiles/', 'avatars/', 'media/', 'uploads/']
const PORTFOLIO_PREFIXES = ['portfolio/', 'event-gallery/', 'media/', 'uploads/']

const IMAGE_EXTENSION_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.avif': 'image/avif',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.jxl': 'image/jxl',
}

const VIDEO_EXTENSION_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
}

function normalizeObjectName(input: string): string {
  const trimmed = input.trim().replace(/^\/+/, '')
  if (!trimmed) return trimmed

  const bucketPrefix = `${minioBucket}/`
  if (trimmed.startsWith(bucketPrefix)) {
    return trimmed.slice(bucketPrefix.length)
  }

  return trimmed
}

function toPublicUrl(objectName: string): string {
  if (minioPublicUrl) {
    return `${minioPublicUrl}/${minioBucket}/${objectName}`
  }

  const protocol = minioUseSSL ? 'https' : 'http'
  return `${protocol}://${minioEndpoint}:${minioPort}/${minioBucket}/${objectName}`
}

function inferMimeType(objectName: string): string {
  const lower = objectName.toLowerCase()
  const extension = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : ''

  if (IMAGE_EXTENSION_MIME[extension]) return IMAGE_EXTENSION_MIME[extension]
  if (VIDEO_EXTENSION_MIME[extension]) return VIDEO_EXTENSION_MIME[extension]
  return 'application/octet-stream'
}

function inferMediaType(objectName: string): CatalogMediaType {
  const mimeType = inferMimeType(objectName)
  return mimeType.startsWith('video/') ? CatalogMediaType.VIDEO : CatalogMediaType.IMAGE
}

async function listObjects(client: Minio.Client, prefix: string, take: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const output: string[] = []
    const stream = client.listObjectsV2(minioBucket, prefix, true)

    stream.on('data', (item) => {
      if (!item.name || output.length >= take) return
      output.push(item.name)
    })

    stream.on('error', reject)
    stream.on('end', () => resolve(output))
  })
}

async function objectExists(client: Minio.Client, objectName: string): Promise<boolean> {
  try {
    await client.statObject(minioBucket, objectName)
    return true
  } catch {
    return false
  }
}

async function resolveProfileObject(client: Minio.Client): Promise<string> {
  const explicit = (process.env.VENDOR_PROFILE_OBJECT || '').trim()
  if (explicit) {
    const normalized = normalizeObjectName(explicit)
    const exists = await objectExists(client, normalized)
    if (!exists) {
      throw new Error(`VENDOR_PROFILE_OBJECT not found in bucket: ${normalized}`)
    }
    return normalized
  }

  for (const prefix of PROFILE_PREFIXES) {
    const matches = await listObjects(client, prefix, 5)
    const image = matches.find((objectName) => inferMimeType(objectName).startsWith('image/'))
    if (image) return image
  }

  throw new Error(
    'No profile image found in bucket. Set VENDOR_PROFILE_OBJECT with an existing object key.',
  )
}

async function resolvePortfolioObjects(client: Minio.Client): Promise<string[]> {
  const explicitRaw = (process.env.VENDOR_PORTFOLIO_OBJECTS || '').trim()

  if (explicitRaw) {
    const normalized = explicitRaw
      .split(',')
      .map((value) => normalizeObjectName(value))
      .filter(Boolean)

    const missing: string[] = []
    for (const key of normalized) {
      const exists = await objectExists(client, key)
      if (!exists) missing.push(key)
    }

    if (missing.length > 0) {
      throw new Error(`VENDOR_PORTFOLIO_OBJECTS not found in bucket: ${missing.join(', ')}`)
    }

    return normalized.slice(0, 12)
  }

  for (const prefix of PORTFOLIO_PREFIXES) {
    const matches = await listObjects(client, prefix, 20)
    const media = matches.filter((objectName) => {
      const mimeType = inferMimeType(objectName)
      return mimeType.startsWith('image/') || mimeType.startsWith('video/')
    })

    if (media.length > 0) {
      return media.slice(0, 12)
    }
  }

  throw new Error(
    'No portfolio media found in bucket. Set VENDOR_PORTFOLIO_OBJECTS with comma-separated object keys.',
  )
}

async function ensureBusinessRole(): Promise<string> {
  const role = await prisma.role.upsert({
    where: { name: 'BUSINESS_ADMIN' },
    update: {
      displayName: 'Business Admin',
      description: 'Vendor/business admin account',
      isSystem: true,
      level: 50,
    },
    create: {
      name: 'BUSINESS_ADMIN',
      displayName: 'Business Admin',
      description: 'Vendor/business admin account',
      isSystem: true,
      level: 50,
    },
  })

  return role.id
}

async function resolveCategoryId(): Promise<string> {
  if (requestedCategorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: requestedCategorySlug } })
    if (category) return category.id
  }

  const existing = await prisma.category.findFirst({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  if (existing) return existing.id

  const fallback = await prisma.category.create({
    data: {
      name: 'General Services',
      slug: 'general-services',
      description: 'Auto-created fallback category for vendor bootstrap script.',
      icon: 'briefcase',
      isActive: true,
      sortOrder: 0,
    },
  })

  return fallback.id
}

async function main() {
  console.log('🔍 Checking MinIO bucket access...')

  const minioClient = new Minio.Client({
    endPoint: minioEndpoint,
    port: minioPort,
    useSSL: minioUseSSL,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
  })

  const bucketExists = await minioClient.bucketExists(minioBucket)
  if (!bucketExists) {
    throw new Error(`Bucket does not exist: ${minioBucket}`)
  }
  console.log(`✅ Bucket exists: ${minioBucket}`)

  const profileObject = await resolveProfileObject(minioClient)
  const portfolioObjects = await resolvePortfolioObjects(minioClient)

  console.log(`✅ Profile object: ${profileObject}`)
  console.log(`✅ Portfolio objects: ${portfolioObjects.length}`)

  const roleId = await ensureBusinessRole()
  const categoryId = await resolveCategoryId()
  const passwordHash = await bcrypt.hash(vendorPassword, 10)

  const user = await prisma.user.upsert({
    where: { email: vendorEmail },
    update: {
      firstName: vendorFirstName,
      lastName: vendorLastName,
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: vendorEmail,
      passwordHash,
      firstName: vendorFirstName,
      lastName: vendorLastName,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      hasCompletedOnboarding: true,
    },
  })

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId,
    },
  })

  const profileObjectPath = normalizeObjectName(profileObject)
  const profileSlugBase = slugify(businessName, { lower: true, strict: true }) || 'vendor'
  const uniqueSlug = `${profileSlugBase}-${user.id.slice(0, 8)}`

  const vendorProfile = await prisma.vendorProfile.upsert({
    where: { userId: user.id },
    update: {
      businessName,
      categoryId,
      status: VendorStatus.ACTIVE,
      profilePhotoUrl: profileObjectPath,
      contactEmail: vendorEmail,
      slug: uniqueSlug,
    },
    create: {
      userId: user.id,
      businessName,
      slug: uniqueSlug,
      categoryId,
      status: VendorStatus.ACTIVE,
      profilePhotoUrl: profileObjectPath,
      contactEmail: vendorEmail,
      contactPhone: null,
      description: 'Vendor profile created by seed-vendor script.',
      tagline: 'Professional event services',
    },
  })

  let portfolio = await prisma.portfolio.findFirst({
    where: {
      vendorProfileId: vendorProfile.id,
      title: portfolioTitle,
    },
    orderBy: { createdAt: 'asc' },
  })

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        vendorProfileId: vendorProfile.id,
        title: portfolioTitle,
        description: 'Portfolio generated from existing MinIO objects.',
        isFeatured: true,
        sortOrder: 0,
      },
    })
  }

  await prisma.mediaItem.deleteMany({ where: { portfolioId: portfolio.id } })

  for (const [index, objectName] of portfolioObjects.entries()) {
    const stat = await minioClient.statObject(minioBucket, objectName)
    const mimeType =
      (typeof stat.metaData?.['content-type'] === 'string' && stat.metaData['content-type']) ||
      inferMimeType(objectName)

    await prisma.mediaItem.create({
      data: {
        portfolioId: portfolio.id,
        type: inferMediaType(objectName),
        url: normalizeObjectName(objectName),
        size: Number(stat.size || 0),
        mimeType,
        sortOrder: index,
        altText: `${businessName} portfolio ${index + 1}`,
        caption: `Uploaded from MinIO object: ${objectName}`,
      },
    })
  }

  console.log('✅ Vendor upsert complete')
  console.log(`   User: ${vendorEmail}`)
  console.log(`   Vendor profile id: ${vendorProfile.id}`)
  console.log(`   Profile object: ${profileObjectPath}`)
  console.log(`   Profile public URL: ${toPublicUrl(profileObjectPath)}`)
  console.log(`   Portfolio id: ${portfolio.id}`)
  console.log(`   Media items inserted: ${portfolioObjects.length}`)
}

main()
  .catch((error) => {
    console.error('❌ seed-vendor failed')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
