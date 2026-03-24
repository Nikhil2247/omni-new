// ============================================================================
// MONGODB TO POSTGRESQL MIGRATION SCRIPT
// ============================================================================
// Migrates users, vendor profiles, and portfolios from old MongoDB backup
// to new PostgreSQL database
// ============================================================================

import * as dotenv from 'dotenv';
dotenv.config();

// Set engine type before importing Prisma
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
}
if (!process.env.PRISMA_QUERY_ENGINE_TYPE) {
  process.env.PRISMA_QUERY_ENGINE_TYPE = 'binary';
}

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

// Create Prisma client with pg-adapter
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BACKUP_FILE = 'D:\\backup\\backup-20-02-2026.gz';
const EXTRACTED_DIR = 'D:\\backup\\extracted';
const DEFAULT_PASSWORD = 'Password123!';
const SALT_ROUNDS = 10;
const BATCH_SIZE = 300;
const PROFILE_BATCH_SIZE = 40;

// ============================================================================
// TYPES - OLD MONGODB SCHEMA
// ============================================================================

interface OldUser {
  _id: { $oid: string };
  name?: string;
  email: string;
  password?: string;
  provider?: string;
  role: 'ADMIN' | 'USER' | 'VENDOR' | 'MANAGER';
  createdAt: { $date: string };
}

interface OldVendorProfile {
  _id: { $oid: string };
  userId: string;
  slug?: string;
  profilePhoto?: string;
  name?: string;
  photos: string[];
  address: string;
  serviceCities?: string;
  tags: string[];
  startingPackage?: string;
  experence?: string;
  ownerName?: string;
  deliveryTime?: string;
  paymentTerm?: string;
  pricing?: string;
  shortDescription?: string;
  description?: string;
  category: string;
  featured: boolean;
  offer?: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
}

interface OldReview {
  _id: { $oid: string };
  userName: string;
  rating: number;
  comment?: string;
  file?: string;
  vendorId: string;
  createdAt: { $date: string };
}

// ============================================================================
// ID MAPPING
// ============================================================================

const userIdMap = new Map<string, string>(); // oldMongoId -> newUUID
const vendorProfileIdMap = new Map<string, string>(); // oldMongoId -> newUUID
const categoryIdMap = new Map<string, string>(); // categorySlug -> newUUID

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function parseMongoDate(dateObj: { $date: string } | string | undefined): Date {
  if (!dateObj) return new Date();
  if (typeof dateObj === 'string') return new Date(dateObj);
  return new Date(dateObj.$date);
}

function getMongoId(idObj: { $oid: string } | string): string {
  if (typeof idObj === 'string') return idObj;
  return idObj.$oid;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function mapOldRoleToNew(oldRole: string): string {
  const roleMap: Record<string, string> = {
    'ADMIN': 'ADMIN',
    'USER': 'USER',
    'VENDOR': 'BUSINESS_ADMIN',
    'MANAGER': 'OPERATIONAL_MANAGER',
  };
  return roleMap[oldRole] || 'USER';
}

function mapOldCategoryToNew(oldCategory: string): string {
  // Map old category names to existing database category slugs
  const categoryMap: Record<string, string> = {
    'photographer': 'photo-videography',
    'photography': 'photo-videography',
    'photo': 'photo-videography',
    'videographer': 'photo-videography',
    'videography': 'photo-videography',
    'photo-videography': 'photo-videography',
    'catering': 'food-catering',
    'caterers': 'food-catering',
    'food': 'food-catering',
    'food-catering': 'food-catering',
    'venue': 'venue',
    'venues': 'venue',
    'florist': 'decor-design',
    'florists': 'decor-design',
    'decorator': 'decor-design',
    'decor': 'decor-design',
    'decoration': 'decor-design',
    'decor-design': 'decor-design',
    'dj': 'entertainment',
    'music': 'entertainment',
    'dj-music': 'entertainment',
    'entertainment': 'entertainment',
    'makeup': 'makeup-hair',
    'makeup-hair': 'makeup-hair',
    'hair': 'makeup-hair',
    'mehndi': 'mehndi-artists',
    'mehndi-artists': 'mehndi-artists',
    'planner': 'planner',
    'wedding-planner': 'planner',
    'wedding-planning': 'planner',
    'event planner': 'event-planner',
    'event-planner': 'event-planner',
    'event management': 'event-management-company',
    'event-management-company': 'event-management-company',
    'hospitality': 'hospitality',
    'cake': 'food-catering',
    'cakes': 'food-catering',
    'bakery': 'food-catering',
    'invitation': 'planner',
    'invitations': 'planner',
    'rental': 'event-management-company',
    'rentals': 'event-management-company',
    'audio-visual': 'audio-visual',
    'av': 'audio-visual',
  };

  const normalized = oldCategory.toLowerCase().trim();
  return categoryMap[normalized] || 'planner';
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function incrementMapCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) || 0) + 1);
}

function formatDistribution(map: Map<string, number>): string[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => `      - ${name}: ${count}`);
}

// ============================================================================
// EXTRACT MONGODB BACKUP
// ============================================================================

async function extractBackup(): Promise<void> {
  console.log('📦 Extracting MongoDB backup...');

  // Create extracted directory
  if (!fs.existsSync(EXTRACTED_DIR)) {
    fs.mkdirSync(EXTRACTED_DIR, { recursive: true });
  }

  // Check if backup file exists
  if (!fs.existsSync(BACKUP_FILE)) {
    throw new Error(`Backup file not found: ${BACKUP_FILE}`);
  }

  // Extract .gz file
  const gzipBuffer = fs.readFileSync(BACKUP_FILE);
  const tarBuffer = zlib.gunzipSync(gzipBuffer);

  // Write tar file
  const tarFile = path.join(EXTRACTED_DIR, 'backup.tar');
  fs.writeFileSync(tarFile, tarBuffer);

  // Extract tar using tar command (Windows needs tar or 7zip)
  try {
    execSync(`tar -xf "${tarFile}" -C "${EXTRACTED_DIR}"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  tar extraction failed, trying alternative method...');
    // For Windows without tar, you may need to use a library or 7zip
    throw new Error('Please extract the backup manually to D:\\backup\\extracted');
  }

  console.log('✅ Backup extracted successfully');
}

// ============================================================================
// READ MONGODB COLLECTIONS
// ============================================================================

function readCollection<T>(collectionName: string): T[] {
  // MongoDB dump creates BSON files, but if exported as JSON:
  const JSON_DIR = 'D:\\backup\\extracted\\json';
  const possiblePaths = [
    path.join(JSON_DIR, `${collectionName}.json`),
    path.join(EXTRACTED_DIR, 'json', `${collectionName}.json`),
    path.join(EXTRACTED_DIR, 'dump', 'omnicassion', `${collectionName}.json`),
    path.join(EXTRACTED_DIR, 'omnicassion', `${collectionName}.json`),
    path.join(EXTRACTED_DIR, `${collectionName}.json`),
    path.join(EXTRACTED_DIR, 'dump', 'omnicassion', `${collectionName}.bson`),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`📖 Reading ${collectionName} from ${filePath}`);

      if (filePath.endsWith('.bson')) {
        // For BSON files, you'll need to use mongorestore or bson library
        throw new Error(`BSON file found. Please export to JSON first using: mongoexport --db=omnicassion --collection=${collectionName} --out=${collectionName}.json`);
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      // Handle both array format and newline-delimited JSON
      if (content.trim().startsWith('[')) {
        return JSON.parse(content);
      } else {
        // Newline-delimited JSON
        return content
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
      }
    }
  }

  console.log(`⚠️  Collection ${collectionName} not found, skipping...`);
  return [];
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function loadExistingCategories(prisma: PrismaClient): Promise<void> {
  console.log('\n📂 Loading existing categories from database...');

  // Load ALL existing categories from database
  const existingCategories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
  });

  for (const category of existingCategories) {
    categoryIdMap.set(category.slug, category.id);
  }

  console.log(`✅ Loaded ${existingCategories.length} categories from database`);
  console.log(`   Categories: ${existingCategories.map(c => c.slug).join(', ')}`);
}

async function migrateRoles(prisma: PrismaClient): Promise<Map<string, string>> {
  console.log('\n👤 Ensuring launch-aligned roles...');

  const roleMap = new Map<string, string>();

  const roles = [
    { name: 'ADMIN_SYSTEM', displayName: 'System Administrator', level: 100, isSystem: true },
    { name: 'ADMIN', displayName: 'Administrator', level: 90, isSystem: true },
    { name: 'BUSINESS_ADMIN', displayName: 'Business Admin', level: 50, isSystem: true },
    { name: 'USER', displayName: 'User', level: 10, isSystem: true },
    { name: 'OPERATIONAL_ADMIN', displayName: 'Operational Admin', level: 80, isSystem: true },
    { name: 'OPERATIONAL_MANAGER', displayName: 'Operations Manager', level: 60, isSystem: true },
  ];

  const roleNames = roles.map((role) => role.name);
  const existingRoles = await prisma.role.findMany({
    where: { name: { in: roleNames } },
    select: { id: true, name: true },
  });

  const existingRoleNames = new Set(existingRoles.map((role) => role.name));

  const rolesToCreate = roles
    .filter((role) => !existingRoleNames.has(role.name))
    .map((role) => ({
      id: randomUUID(),
      name: role.name,
      displayName: role.displayName,
      level: role.level,
      isSystem: role.isSystem,
    }));

  if (rolesToCreate.length > 0) {
    await prisma.role.createMany({
      data: rolesToCreate,
      skipDuplicates: true,
    });
  }

  const finalRoles = await prisma.role.findMany({
    where: { name: { in: roleNames } },
    select: { id: true, name: true },
  });

  for (const role of finalRoles) {
    roleMap.set(role.name, role.id);
  }

  console.log(`✅ Created/found ${roles.length} roles`);
  return roleMap;
}

async function migrateUsers(
  prisma: PrismaClient,
  oldUsers: OldUser[],
  roleMap: Map<string, string>
): Promise<Map<string, number>> {
  console.log(`\n👥 Migrating ${oldUsers.length} users...`);

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  let migrated = 0;
  let skipped = 0;
  const roleDistribution = new Map<string, number>();

  const normalizedUsers = oldUsers.map((oldUser) => ({
    oldUser,
    oldId: getMongoId(oldUser._id),
    email: oldUser.email.toLowerCase(),
  }));

  const uniqueEmails = [...new Set(normalizedUsers.map((entry) => entry.email))];
  const existingUserByEmail = new Map<string, string>();

  for (const emailBatch of chunkArray(uniqueEmails, BATCH_SIZE)) {
    const existingBatch = await prisma.user.findMany({
      where: { email: { in: emailBatch } },
      select: { id: true, email: true },
    });
    for (const existingUser of existingBatch) {
      existingUserByEmail.set(existingUser.email, existingUser.id);
    }
  }

  const usersToCreate: Array<{
    oldId: string;
    email: string;
    newUserId: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
    roleId: string;
  }> = [];

  const assignmentsToCreate: Array<{ id: string; userId: string; roleId: string }> = [];

  for (const { oldUser, oldId, email } of normalizedUsers) {
    const existingUserId = existingUserByEmail.get(email);

    const newRoleName = mapOldRoleToNew(oldUser.role);
    const roleId = roleMap.get(newRoleName);

    if (existingUserId) {
      userIdMap.set(oldId, existingUserId);

      if (roleId) {
        assignmentsToCreate.push({
          id: randomUUID(),
          userId: existingUserId,
          roleId,
        });
        incrementMapCount(roleDistribution, newRoleName);
      }

      skipped++;
      continue;
    }

    const nameParts = (oldUser.name || '').split(' ');
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(' ') || null;
    const newUserId = randomUUID();
    if (!roleId) {
      console.log(`⚠️  Skipping role assignment for ${email}: role not found (${newRoleName})`);
      skipped++;
      continue;
    }

    usersToCreate.push({
      oldId,
      email,
      newUserId,
      firstName,
      lastName,
      createdAt: parseMongoDate(oldUser.createdAt),
      roleId,
    });

    incrementMapCount(roleDistribution, newRoleName);

    userIdMap.set(oldId, newUserId);
  }

  for (const batch of chunkArray(usersToCreate, BATCH_SIZE)) {
    await prisma.user.createMany({
      data: batch.map((item) => ({
        id: item.newUserId,
        email: item.email,
        passwordHash: hashedPassword,
        firstName: item.firstName,
        lastName: item.lastName,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        createdAt: item.createdAt,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    assignmentsToCreate.push(
      ...batch.map((item) => ({
        id: randomUUID(),
        userId: item.newUserId,
        roleId: item.roleId,
      })),
    );
  }

  for (const assignmentBatch of chunkArray(assignmentsToCreate, BATCH_SIZE)) {
    await prisma.userRoleAssignment.createMany({
      data: assignmentBatch,
      skipDuplicates: true,
    });
  }

  migrated = usersToCreate.length;

  console.log(`✅ Migrated ${migrated} users, skipped ${skipped} (already exist)`);
  return roleDistribution;
}

async function migrateVendorProfiles(
  prisma: PrismaClient,
  oldProfiles: OldVendorProfile[]
): Promise<Map<string, number>> {
  console.log(`\n🏪 Migrating ${oldProfiles.length} vendor profiles...`);

  let migrated = 0;
  let skipped = 0;
  const categoryDistribution = new Map<string, number>();

  const userIds = [...new Set(oldProfiles.map((profile) => userIdMap.get(profile.userId)).filter(Boolean) as string[])];
  const existingProfileByUserId = new Map<string, string>();

  for (const userIdBatch of chunkArray(userIds, BATCH_SIZE)) {
    const existingProfiles = await prisma.vendorProfile.findMany({
      where: { userId: { in: userIdBatch } },
      select: { id: true, userId: true },
    });
    for (const profile of existingProfiles) {
      if (profile.userId) {
        existingProfileByUserId.set(profile.userId, profile.id);
      }
    }
  }

  const incomingTagMap = new Map<string, string>();
  for (const oldProfile of oldProfiles) {
    for (const tagName of oldProfile.tags || []) {
      const tagSlug = generateSlug(tagName);
      if (!tagSlug) continue;
      if (!incomingTagMap.has(tagSlug)) {
        incomingTagMap.set(tagSlug, tagName);
      }
    }
  }

  const tagSlugs = [...incomingTagMap.keys()];
  const existingTags = new Map<string, string>();

  for (const tagSlugBatch of chunkArray(tagSlugs, BATCH_SIZE)) {
    const foundTags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugBatch } },
      select: { id: true, slug: true },
    });
    for (const tag of foundTags) {
      existingTags.set(tag.slug, tag.id);
    }
  }

  const tagsToCreate = tagSlugs
    .filter((slug) => !existingTags.has(slug))
    .map((slug) => ({
      id: randomUUID(),
      slug,
      name: incomingTagMap.get(slug) || slug,
    }));

  if (tagsToCreate.length > 0) {
    await prisma.tag.createMany({
      data: tagsToCreate,
      skipDuplicates: true,
    });
  }

  const finalTagMap = new Map<string, string>();
  for (const tagSlugBatch of chunkArray(tagSlugs, BATCH_SIZE)) {
    const foundTags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugBatch } },
      select: { id: true, slug: true },
    });
    for (const tag of foundTags) {
      finalTagMap.set(tag.slug, tag.id);
    }
  }

  const existingSlugs = await prisma.vendorProfile.findMany({
    select: { slug: true },
  });
  const usedSlugs = new Set(existingSlugs.map((profile) => profile.slug));

  type VendorBatchPayload = {
    oldId: string;
    profileId: string;
    profileData: {
      id: string;
      userId: string;
      businessName: string;
      slug: string;
      categoryId: string;
      description: string | null;
      tagline: string | null;
      profilePhotoUrl: string | null;
      serviceRadius: number | null;
      status: 'ACTIVE';
      verifiedAt: Date | null;
      featuredUntil: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
    portfolioData?: {
      id: string;
      vendorProfileId: string;
      title: string;
      description: string;
      sortOrder: number;
      isFeatured: boolean;
    };
    mediaData: Array<{
      id: string;
      portfolioId: string;
      type: 'IMAGE';
      url: string;
      thumbnailUrl: string;
      mimeType: string;
      size: number;
      sortOrder: number;
      isApproved: boolean;
    }>;
    vendorTagData: Array<{
      id: string;
      vendorProfileId: string;
      tagId: string;
    }>;
    serviceData?: {
      id: string;
      vendorProfileId: string;
      name: string;
      description: string;
      pricingType: 'STARTING_AT';
      currency: string;
      startingPrice: number | null;
      isActive: boolean;
      sortOrder: number;
    };
  };

  const profilesToMigrate: VendorBatchPayload[] = [];

  for (const oldProfile of oldProfiles) {
    const oldId = getMongoId(oldProfile._id);
    const newUserId = userIdMap.get(oldProfile.userId);

    if (!newUserId) {
      skipped++;
      continue;
    }

    const existingProfileId = existingProfileByUserId.get(newUserId);
    if (existingProfileId) {
      vendorProfileIdMap.set(oldId, existingProfileId);
      skipped++;
      continue;
    }

    const categorySlug = mapOldCategoryToNew(oldProfile.category);
    const categoryId = categoryIdMap.get(categorySlug);

    if (!categoryId) {
      skipped++;
      continue;
    }

    const profileId = randomUUID();
    let slug = oldProfile.slug || generateSlug(oldProfile.name || `vendor-${Date.now()}`);
    if (!slug) {
      slug = `vendor-${profileId}`;
    }

    if (usedSlugs.has(slug)) {
      slug = `${slug}-${Date.now()}`;
    }
    usedSlugs.add(slug);

    const profileData = {
      id: profileId,
      userId: newUserId,
      businessName: oldProfile.name || 'Unnamed Business',
      slug,
      categoryId,
      description: oldProfile.description || oldProfile.shortDescription || null,
      tagline: oldProfile.shortDescription || null,
      profilePhotoUrl: oldProfile.profilePhoto || null,
      serviceRadius: oldProfile.serviceCities ? 50 : null,
      status: 'ACTIVE' as const,
      verifiedAt: oldProfile.featured ? new Date() : null,
      featuredUntil: oldProfile.featured ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      createdAt: parseMongoDate(oldProfile.createdAt),
      updatedAt: parseMongoDate(oldProfile.updatedAt),
    };

    const mediaData: VendorBatchPayload['mediaData'] = [];
    let portfolioData: VendorBatchPayload['portfolioData'];

    if (oldProfile.photos && oldProfile.photos.length > 0) {
      const portfolioId = randomUUID();
      portfolioData = {
        id: portfolioId,
        vendorProfileId: profileId,
        title: 'Main Portfolio',
        description: 'Migrated from previous system',
        sortOrder: 0,
        isFeatured: true,
      };

      for (let index = 0; index < oldProfile.photos.length; index++) {
        const photoUrl = oldProfile.photos[index];
        mediaData.push({
          id: randomUUID(),
          portfolioId,
          type: 'IMAGE',
          url: photoUrl,
          thumbnailUrl: photoUrl,
          mimeType: 'image/jpeg',
          size: 0,
          sortOrder: index,
          isApproved: true,
        });
      }
    }

    const vendorTagData: VendorBatchPayload['vendorTagData'] = [];
    for (const tagName of oldProfile.tags || []) {
      const tagSlug = generateSlug(tagName);
      const tagId = finalTagMap.get(tagSlug);
      if (!tagId) continue;
      vendorTagData.push({
        id: randomUUID(),
        vendorProfileId: profileId,
        tagId,
      });
    }

    const hasServiceData = oldProfile.startingPackage || oldProfile.pricing;
    const serviceData = hasServiceData
      ? {
          id: randomUUID(),
          vendorProfileId: profileId,
          name: 'Main Service',
          description: `Experience: ${oldProfile.experence || 'Not specified'}\nDelivery Time: ${oldProfile.deliveryTime || 'Not specified'}\nPayment Terms: ${oldProfile.paymentTerm || 'Not specified'}`,
          pricingType: 'STARTING_AT' as const,
          currency: 'INR',
          startingPrice: parseFloat(oldProfile.startingPackage?.replace(/[^0-9.]/g, '') || '0') || null,
          isActive: true,
          sortOrder: 0,
        }
      : undefined;

    profilesToMigrate.push({
      oldId,
      profileId,
      profileData,
      portfolioData,
      mediaData,
      vendorTagData,
      serviceData,
    });

    incrementMapCount(categoryDistribution, categorySlug);
  }

  for (const batch of chunkArray(profilesToMigrate, PROFILE_BATCH_SIZE)) {
    await prisma.vendorProfile.createMany({
      data: batch.map((item) => item.profileData),
      skipDuplicates: true,
    });

    const batchUserIds = batch.map((item) => item.profileData.userId);
    const persistedProfiles = await prisma.vendorProfile.findMany({
      where: { userId: { in: batchUserIds } },
      select: { id: true, userId: true },
    });
    const persistedProfileIdByUserId = new Map(
      persistedProfiles.map((profile) => [profile.userId, profile.id]),
    );

    const resolvedBatch = batch
      .map((item) => {
        const resolvedProfileId = persistedProfileIdByUserId.get(item.profileData.userId);
        if (!resolvedProfileId) return null;
        return {
          oldId: item.oldId,
          resolvedProfileId,
          portfolioData: item.portfolioData
            ? {
                ...item.portfolioData,
                vendorProfileId: resolvedProfileId,
              }
            : undefined,
          mediaData: item.mediaData,
          vendorTagData: item.vendorTagData.map((row) => ({
            ...row,
            vendorProfileId: resolvedProfileId,
          })),
          serviceData: item.serviceData
            ? {
                ...item.serviceData,
                vendorProfileId: resolvedProfileId,
              }
            : undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const portfolioData = resolvedBatch
      .map((item) => item.portfolioData)
      .filter((portfolio): portfolio is NonNullable<typeof portfolio> => Boolean(portfolio));

    if (portfolioData.length > 0) {
      await prisma.portfolio.createMany({
        data: portfolioData,
        skipDuplicates: true,
      });
    }

    const portfolioIdMapByOldProfileId = new Map<string, string>();
    for (const item of resolvedBatch) {
      if (item.portfolioData) {
        portfolioIdMapByOldProfileId.set(item.oldId, item.portfolioData.id);
      }
    }

    const mediaData = resolvedBatch.flatMap((item) => {
      const oldPortfolioId = portfolioIdMapByOldProfileId.get(item.oldId);
      if (!oldPortfolioId) return [];
      return item.mediaData.map((media) => ({
        ...media,
        portfolioId: oldPortfolioId,
      }));
    });

    if (mediaData.length > 0) {
      await prisma.mediaItem.createMany({
        data: mediaData,
        skipDuplicates: true,
      });
    }

    const vendorTagData = resolvedBatch.flatMap((item) => item.vendorTagData);
    if (vendorTagData.length > 0) {
      await prisma.vendorTag.createMany({
        data: vendorTagData,
        skipDuplicates: true,
      });
    }

    const serviceData = resolvedBatch
      .map((item) => item.serviceData)
      .filter((service): service is NonNullable<typeof service> => Boolean(service));

    if (serviceData.length > 0) {
      await prisma.service.createMany({
        data: serviceData,
        skipDuplicates: true,
      });
    }

    for (const migratedProfile of resolvedBatch) {
      vendorProfileIdMap.set(migratedProfile.oldId, migratedProfile.resolvedProfileId);
    }
    migrated += resolvedBatch.length;
  }

  console.log(`✅ Migrated ${migrated} vendor profiles, skipped ${skipped}`);
  return categoryDistribution;
}

// ============================================================================
// UNCLAIMED VENDOR PROFILES MIGRATION
// ============================================================================
// Migrates vendor profiles as UNCLAIMED with PUBLIC plan (no user accounts)
// These can be claimed later by vendors
// ============================================================================

async function migrateUnclaimedVendorProfiles(
  prisma: PrismaClient,
  oldProfiles: OldVendorProfile[],
  targetCategories: string[] // e.g., ['decorator', 'decoration', 'photographer', 'photography']
): Promise<Map<string, number>> {
  // Filter profiles for target categories only
  const filteredProfiles = oldProfiles.filter((profile) => {
    const category = profile.category?.toLowerCase().trim() || '';
    return targetCategories.some((target) => category.includes(target.toLowerCase()));
  });

  console.log(`\n🏪 Migrating ${filteredProfiles.length} UNCLAIMED vendor profiles (from ${oldProfiles.length} total)...`);
  console.log(`   Target categories: ${targetCategories.join(', ')}`);

  let migrated = 0;
  let skipped = 0;
  const categoryDistribution = new Map<string, number>();

  // Collect all tags from profiles
  const incomingTagMap = new Map<string, string>();
  for (const oldProfile of filteredProfiles) {
    for (const tagName of oldProfile.tags || []) {
      const tagSlug = generateSlug(tagName);
      if (!tagSlug) continue;
      if (!incomingTagMap.has(tagSlug)) {
        incomingTagMap.set(tagSlug, tagName);
      }
    }
  }

  // Check existing tags
  const tagSlugs = [...incomingTagMap.keys()];
  const existingTags = new Map<string, string>();

  for (const tagSlugBatch of chunkArray(tagSlugs, BATCH_SIZE)) {
    const foundTags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugBatch } },
      select: { id: true, slug: true },
    });
    for (const tag of foundTags) {
      existingTags.set(tag.slug, tag.id);
    }
  }

  // Create missing tags
  const tagsToCreate = tagSlugs
    .filter((slug) => !existingTags.has(slug))
    .map((slug) => ({
      id: randomUUID(),
      slug,
      name: incomingTagMap.get(slug) || slug,
    }));

  if (tagsToCreate.length > 0) {
    await prisma.tag.createMany({
      data: tagsToCreate,
      skipDuplicates: true,
    });
  }

  // Build final tag map
  const finalTagMap = new Map<string, string>();
  for (const tagSlugBatch of chunkArray(tagSlugs, BATCH_SIZE)) {
    const foundTags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugBatch } },
      select: { id: true, slug: true },
    });
    for (const tag of foundTags) {
      finalTagMap.set(tag.slug, tag.id);
    }
  }

  // Get existing slugs to avoid duplicates
  const existingSlugs = await prisma.vendorProfile.findMany({
    select: { slug: true },
  });
  const usedSlugs = new Set(existingSlugs.map((profile) => profile.slug));

  // Also check existing business names to avoid duplicates
  const existingNames = await prisma.vendorProfile.findMany({
    select: { businessName: true },
  });
  const usedNames = new Set(existingNames.map((profile) => profile.businessName.toLowerCase()));

  type UnclaimedVendorBatchPayload = {
    oldId: string;
    profileId: string;
    profileData: {
      id: string;
      userId: null;
      businessName: string;
      slug: string;
      categoryId: string;
      description: string | null;
      tagline: string | null;
      profilePhotoUrl: string | null;
      serviceRadius: number | null;
      status: 'UNCLAIMED';
      planTier: 'PUBLIC';
      verifiedAt: null;
      featuredUntil: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
    portfolioData?: {
      id: string;
      vendorProfileId: string;
      title: string;
      description: string;
      sortOrder: number;
      isFeatured: boolean;
    };
    mediaData: Array<{
      id: string;
      portfolioId: string;
      type: 'IMAGE';
      url: string;
      thumbnailUrl: string;
      mimeType: string;
      size: number;
      sortOrder: number;
      isApproved: boolean;
    }>;
    vendorTagData: Array<{
      id: string;
      vendorProfileId: string;
      tagId: string;
    }>;
    serviceData?: {
      id: string;
      vendorProfileId: string;
      name: string;
      description: string;
      pricingType: 'STARTING_AT';
      currency: string;
      startingPrice: number | null;
      isActive: boolean;
      sortOrder: number;
    };
  };

  const profilesToMigrate: UnclaimedVendorBatchPayload[] = [];

  for (const oldProfile of filteredProfiles) {
    const oldId = getMongoId(oldProfile._id);
    const businessName = oldProfile.name || 'Unnamed Business';

    // Skip if business name already exists
    if (usedNames.has(businessName.toLowerCase())) {
      console.log(`   ⏭️  Skipping duplicate: ${businessName}`);
      skipped++;
      continue;
    }

    const categorySlug = mapOldCategoryToNew(oldProfile.category);
    const categoryId = categoryIdMap.get(categorySlug);

    if (!categoryId) {
      console.log(`   ⚠️  Category not found for: ${oldProfile.category}`);
      skipped++;
      continue;
    }

    const profileId = randomUUID();
    let slug = oldProfile.slug || generateSlug(oldProfile.name || `vendor-${Date.now()}`);
    if (!slug) {
      slug = `vendor-${profileId}`;
    }

    if (usedSlugs.has(slug)) {
      slug = `${slug}-${Date.now()}`;
    }
    usedSlugs.add(slug);
    usedNames.add(businessName.toLowerCase());

    const profileData = {
      id: profileId,
      userId: null, // UNCLAIMED - no user
      businessName,
      slug,
      categoryId,
      description: oldProfile.description || oldProfile.shortDescription || null,
      tagline: oldProfile.shortDescription || null,
      profilePhotoUrl: oldProfile.profilePhoto || null,
      serviceRadius: oldProfile.serviceCities ? 50 : null,
      status: 'UNCLAIMED' as const,
      planTier: 'PUBLIC' as const,
      verifiedAt: null,
      featuredUntil: oldProfile.featured ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      createdAt: parseMongoDate(oldProfile.createdAt),
      updatedAt: parseMongoDate(oldProfile.updatedAt),
    };

    const mediaData: UnclaimedVendorBatchPayload['mediaData'] = [];
    let portfolioData: UnclaimedVendorBatchPayload['portfolioData'];

    if (oldProfile.photos && oldProfile.photos.length > 0) {
      const portfolioId = randomUUID();
      portfolioData = {
        id: portfolioId,
        vendorProfileId: profileId,
        title: 'Main Portfolio',
        description: 'Migrated from previous system',
        sortOrder: 0,
        isFeatured: true,
      };

      for (let index = 0; index < oldProfile.photos.length; index++) {
        const photoUrl = oldProfile.photos[index];
        mediaData.push({
          id: randomUUID(),
          portfolioId,
          type: 'IMAGE',
          url: photoUrl,
          thumbnailUrl: photoUrl,
          mimeType: 'image/jpeg',
          size: 0,
          sortOrder: index,
          isApproved: true,
        });
      }
    }

    const vendorTagData: UnclaimedVendorBatchPayload['vendorTagData'] = [];
    for (const tagName of oldProfile.tags || []) {
      const tagSlug = generateSlug(tagName);
      const tagId = finalTagMap.get(tagSlug);
      if (!tagId) continue;
      vendorTagData.push({
        id: randomUUID(),
        vendorProfileId: profileId,
        tagId,
      });
    }

    const hasServiceData = oldProfile.startingPackage || oldProfile.pricing;
    const serviceData = hasServiceData
      ? {
          id: randomUUID(),
          vendorProfileId: profileId,
          name: 'Main Service',
          description: `Experience: ${oldProfile.experence || 'Not specified'}\nDelivery Time: ${oldProfile.deliveryTime || 'Not specified'}\nPayment Terms: ${oldProfile.paymentTerm || 'Not specified'}`,
          pricingType: 'STARTING_AT' as const,
          currency: 'INR',
          startingPrice: parseFloat(oldProfile.startingPackage?.replace(/[^0-9.]/g, '') || '0') || null,
          isActive: true,
          sortOrder: 0,
        }
      : undefined;

    profilesToMigrate.push({
      oldId,
      profileId,
      profileData,
      portfolioData,
      mediaData,
      vendorTagData,
      serviceData,
    });

    incrementMapCount(categoryDistribution, categorySlug);
  }

  // Batch insert profiles
  for (const batch of chunkArray(profilesToMigrate, PROFILE_BATCH_SIZE)) {
    await prisma.vendorProfile.createMany({
      data: batch.map((item) => item.profileData),
      skipDuplicates: true,
    });

    // Get persisted profile IDs
    const batchSlugs = batch.map((item) => item.profileData.slug);
    const persistedProfiles = await prisma.vendorProfile.findMany({
      where: { slug: { in: batchSlugs } },
      select: { id: true, slug: true },
    });
    const persistedProfileIdBySlug = new Map(
      persistedProfiles.map((profile) => [profile.slug, profile.id]),
    );

    const resolvedBatch = batch
      .map((item) => {
        const resolvedProfileId = persistedProfileIdBySlug.get(item.profileData.slug);
        if (!resolvedProfileId) return null;
        return {
          oldId: item.oldId,
          resolvedProfileId,
          portfolioData: item.portfolioData
            ? {
                ...item.portfolioData,
                vendorProfileId: resolvedProfileId,
              }
            : undefined,
          mediaData: item.mediaData,
          vendorTagData: item.vendorTagData.map((row) => ({
            ...row,
            vendorProfileId: resolvedProfileId,
          })),
          serviceData: item.serviceData
            ? {
                ...item.serviceData,
                vendorProfileId: resolvedProfileId,
              }
            : undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    // Create portfolios
    const portfolioData = resolvedBatch
      .map((item) => item.portfolioData)
      .filter((portfolio): portfolio is NonNullable<typeof portfolio> => Boolean(portfolio));

    if (portfolioData.length > 0) {
      await prisma.portfolio.createMany({
        data: portfolioData,
        skipDuplicates: true,
      });
    }

    // Map portfolio IDs
    const portfolioIdMapByOldProfileId = new Map<string, string>();
    for (const item of resolvedBatch) {
      if (item.portfolioData) {
        portfolioIdMapByOldProfileId.set(item.oldId, item.portfolioData.id);
      }
    }

    // Create media items
    const mediaData = resolvedBatch.flatMap((item) => {
      const oldPortfolioId = portfolioIdMapByOldProfileId.get(item.oldId);
      if (!oldPortfolioId) return [];
      return item.mediaData.map((media) => ({
        ...media,
        portfolioId: oldPortfolioId,
      }));
    });

    if (mediaData.length > 0) {
      await prisma.mediaItem.createMany({
        data: mediaData,
        skipDuplicates: true,
      });
    }

    // Create vendor tags
    const vendorTagData = resolvedBatch.flatMap((item) => item.vendorTagData);
    if (vendorTagData.length > 0) {
      await prisma.vendorTag.createMany({
        data: vendorTagData,
        skipDuplicates: true,
      });
    }

    // Create services
    const serviceData = resolvedBatch
      .map((item) => item.serviceData)
      .filter((service): service is NonNullable<typeof service> => Boolean(service));

    if (serviceData.length > 0) {
      await prisma.service.createMany({
        data: serviceData,
        skipDuplicates: true,
      });
    }

    for (const migratedProfile of resolvedBatch) {
      vendorProfileIdMap.set(migratedProfile.oldId, migratedProfile.resolvedProfileId);
    }
    migrated += resolvedBatch.length;
  }

  console.log(`✅ Migrated ${migrated} UNCLAIMED vendor profiles, skipped ${skipped}`);
  return categoryDistribution;
}

async function migrateReviews(
  prisma: PrismaClient,
  oldReviews: OldReview[]
): Promise<void> {
  console.log(`\n⭐ Migrating ${oldReviews.length} reviews...`);

  let migrated = 0;
  let skipped = 0;

  const adminUser = await prisma.user.findFirst({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'ADMIN_SYSTEM',
          },
        },
      },
    },
    select: { id: true },
  });

  if (!adminUser) {
    console.log('⚠️  No admin user found for orphan reviews, skipping all reviews...');
    console.log(`✅ Migrated 0 reviews, skipped ${oldReviews.length}`);
    return;
  }

  const reviewsToCreate = oldReviews
    .map((oldReview) => {
      const vendorProfileId = vendorProfileIdMap.get(oldReview.vendorId);
      if (!vendorProfileId) {
        skipped++;
        return null;
      }

      return {
        id: randomUUID(),
        vendorProfileId,
        reviewerId: adminUser.id,
        rating: Math.min(5, Math.max(1, oldReview.rating)),
        title: `Review by ${oldReview.userName}`,
        body: oldReview.comment,
        status: 'APPROVED' as const,
        createdAt: parseMongoDate(oldReview.createdAt),
        updatedAt: new Date(),
      };
    })
    .filter((review): review is NonNullable<typeof review> => Boolean(review));

  for (const batch of chunkArray(reviewsToCreate, BATCH_SIZE)) {
    const result = await prisma.vendorReview.createMany({
      data: batch,
      skipDuplicates: true,
    });
    migrated += result.count;
  }

  console.log(`✅ Migrated ${migrated} reviews, skipped ${skipped}`);
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runMigration(): Promise<void> {
  console.log('🚀 Starting MongoDB to PostgreSQL Migration');
  console.log('='.repeat(60));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📁 Backup: ${BACKUP_FILE}`);
  console.log(`🔐 Default Password: ${DEFAULT_PASSWORD}`);
  console.log('='.repeat(60));

  const prisma = createPrismaClient();

  try {
    // Step 1: Extract backup
    // Uncomment if backup needs extraction
    // await extractBackup();

    // Step 2: Read collections from extracted JSON files
    console.log('\n📚 Reading MongoDB collections...');

    const oldUsers = readCollection<OldUser>('User');
    const oldVendorProfiles = readCollection<OldVendorProfile>('VendorProfile');
    const oldReviews = readCollection<OldReview>('Review');

    console.log(`   Found ${oldUsers.length} users`);
    console.log(`   Found ${oldVendorProfiles.length} vendor profiles`);
    console.log(`   Found ${oldReviews.length} reviews`);

    // Step 3: Load existing categories and ensure roles
    await loadExistingCategories(prisma);
    const roleMap = await migrateRoles(prisma);

    // Step 4: Migrate users
    const roleDistribution = await migrateUsers(prisma, oldUsers, roleMap);

    // Step 5: Migrate vendor profiles with portfolios (claimed vendors with users)
    const categoryDistribution = await migrateVendorProfiles(prisma, oldVendorProfiles);

    // Step 6: Migrate UNCLAIMED vendor profiles (decoration & photographer)
    // These are added with PUBLIC plan and can be claimed later
    const unclaimedCategories = [
      'decorator',
      'decoration',
      'decor',
      'photographer',
      'photography',
      'photo',
    ];
    const unclaimedCategoryDistribution = await migrateUnclaimedVendorProfiles(
      prisma,
      oldVendorProfiles,
      unclaimedCategories,
    );

    // Merge category distributions
    for (const [key, value] of unclaimedCategoryDistribution) {
      categoryDistribution.set(
        `${key} (unclaimed)`,
        (categoryDistribution.get(`${key} (unclaimed)`) || 0) + value,
      );
    }

    // Step 7: Migrate reviews
    await migrateReviews(prisma, oldReviews);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`   Users migrated: ${userIdMap.size}`);
    console.log(`   Vendor profiles migrated: ${vendorProfileIdMap.size}`);
    console.log(`   Categories created: ${categoryIdMap.size}`);
    console.log('');
    console.log('📊 Role Mapping Distribution');
    const roleLines = formatDistribution(roleDistribution);
    if (roleLines.length === 0) {
      console.log('      - No role mappings created');
    } else {
      for (const line of roleLines) console.log(line);
    }

    console.log('📊 Category Mapping Distribution');
    const categoryLines = formatDistribution(categoryDistribution);
    if (categoryLines.length === 0) {
      console.log('      - No category mappings created');
    } else {
      for (const line of categoryLines) console.log(line);
    }

    console.log('\n⚠️  IMPORTANT: All user passwords have been set to: ' + DEFAULT_PASSWORD);
    console.log('   Users should change their passwords after first login.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// RUN
// ============================================================================

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
