// ============================================================================
// LINK VENDOR DATA SCRIPT
// ============================================================================
// Links service cities, addresses, and other missing data to existing vendors
// SAFE: Only ADDS data, NEVER deletes
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
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BACKUP_JSON_DIR = 'D:\\backup\\extracted\\json';
const DRY_RUN = process.argv.includes('--dry-run');

// ============================================================================
// PRISMA CLIENT
// ============================================================================

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
// TYPES
// ============================================================================

interface OldVendorProfile {
  _id: { $oid: string };
  userId: string;
  slug?: string;
  name?: string;
  address: string;
  serviceCities?: string;
  tags?: string[];
  category: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
}

interface CityMapping {
  cityId: string;
  cityName: string;
  stateId: string;
}

// ============================================================================
// CITY NAME NORMALIZATION
// ============================================================================

// Map common city name variations/typos to normalized names
const CITY_NAME_NORMALIZATION: Record<string, string[]> = {
  'Chandigarh': ['chandigarh', 'chandiagrh', 'chandigrah', 'chd'],
  'Mohali': ['mohali', 'sas nagar', 'sahibzada ajit singh nagar'],
  'Panchkula': ['panchkula', 'panchkulla'],
  'Kharar': ['kharar', 'khrar'],
  'Zirakpur': ['zirakpur', 'zirakpoor', 'zirkpur'],
  'Dera Bassi': ['dera bassi', 'derabassi'],
  'Nayagaon': ['nayagaon', 'naya gaon'],
  'Mullanpur': ['mullanpur', 'new chandigarh'],
  'Landran': ['landran'],
  'Kurali': ['kurali'],
  'Morinda': ['morinda'],
  'Ropar': ['ropar', 'rupnagar'],
};

// Cities that should map to multiple service areas (Tricity = Chandigarh + Mohali + Panchkula)
const CITY_GROUPS: Record<string, string[]> = {
  'tricity': ['Chandigarh', 'Mohali', 'Panchkula'],
  'tri-city': ['Chandigarh', 'Mohali', 'Panchkula'],
  'tri city': ['Chandigarh', 'Mohali', 'Panchkula'],
  'try city': ['Chandigarh', 'Mohali', 'Panchkula'], // Common typo
};

function normalizeCityName(rawCity: string): string[] {
  const normalized = rawCity.toLowerCase().trim();

  // Check for city groups first (like "Tricity")
  for (const [groupKey, cities] of Object.entries(CITY_GROUPS)) {
    if (normalized === groupKey || normalized.includes(groupKey)) {
      return cities;
    }
  }

  // Check for individual city name mappings
  for (const [standardName, variations] of Object.entries(CITY_NAME_NORMALIZATION)) {
    if (variations.some(v => normalized === v || normalized.includes(v))) {
      return [standardName];
    }
  }

  // Return as-is with title case if no mapping found
  return [rawCity.trim().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')];
}

// Parse address to extract city hint
function extractCityFromAddress(address: string): string | null {
  const normalizedAddr = address.toLowerCase();

  // Check for known cities in address
  for (const [standardName, variations] of Object.entries(CITY_NAME_NORMALIZATION)) {
    if (variations.some(v => normalizedAddr.includes(v))) {
      return standardName;
    }
  }

  return null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function readBackupCollection<T>(collectionName: string): T[] {
  const filePath = path.join(BACKUP_JSON_DIR, `${collectionName}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`   File not found: ${filePath}`);
    return [];
  }

  console.log(`   Reading ${collectionName} from ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');

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

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// ============================================================================
// MAIN LINKING FUNCTIONS
// ============================================================================

async function ensureCitiesExist(
  prisma: PrismaClient,
  cityNames: string[]
): Promise<Map<string, CityMapping>> {
  const cityMap = new Map<string, CityMapping>();

  // Get India country
  const india = await prisma.country.findFirst({
    where: { code: 'IND' },
  });

  if (!india) {
    console.log('   Creating India country...');
    if (!DRY_RUN) {
      const newIndia = await prisma.country.create({
        data: {
          name: 'India',
          code: 'IND',
          code2: 'IN',
          dialCode: '+91',
          currency: 'INR',
          isActive: true,
        },
      });
      return ensureCitiesExist(prisma, cityNames);
    }
    return cityMap;
  }

  // Get or create states
  const getOrCreateState = async (stateName: string, code: string): Promise<string> => {
    let state = await prisma.state.findFirst({
      where: { countryId: india.id, name: stateName },
    });

    if (!state && !DRY_RUN) {
      state = await prisma.state.create({
        data: {
          countryId: india.id,
          name: stateName,
          code: code,
          isActive: true,
        },
      });
      console.log(`   Created state: ${stateName}`);
    }

    return state?.id || '';
  };

  // State mappings for cities
  const cityToState: Record<string, { state: string; code: string }> = {
    'Chandigarh': { state: 'Chandigarh', code: 'CH' },
    'Mohali': { state: 'Punjab', code: 'PB' },
    'Panchkula': { state: 'Haryana', code: 'HR' },
    'Kharar': { state: 'Punjab', code: 'PB' },
    'Zirakpur': { state: 'Punjab', code: 'PB' },
    'Dera Bassi': { state: 'Punjab', code: 'PB' },
    'Nayagaon': { state: 'Punjab', code: 'PB' },
    'Mullanpur': { state: 'Punjab', code: 'PB' },
    'Landran': { state: 'Punjab', code: 'PB' },
    'Kurali': { state: 'Punjab', code: 'PB' },
    'Morinda': { state: 'Punjab', code: 'PB' },
    'Ropar': { state: 'Punjab', code: 'PB' },
    'Solan': { state: 'Himachal Pradesh', code: 'HP' },
    'Rishikesh': { state: 'Uttarakhand', code: 'UK' },
    'Try City': { state: 'Punjab', code: 'PB' }, // Typo for Tricity - default to Punjab
  };

  for (const cityName of cityNames) {
    const stateInfo = cityToState[cityName] || { state: 'Punjab', code: 'PB' };
    const stateId = await getOrCreateState(stateInfo.state, stateInfo.code);

    if (!stateId) continue;

    // Find or create city
    let city = await prisma.city.findFirst({
      where: { stateId, name: cityName },
    });

    if (!city && !DRY_RUN) {
      city = await prisma.city.create({
        data: {
          stateId,
          name: cityName,
          isActive: true,
        },
      });
      console.log(`   Created city: ${cityName}`);
    }

    if (city) {
      cityMap.set(cityName, {
        cityId: city.id,
        cityName: city.name,
        stateId,
      });
    }
  }

  return cityMap;
}

async function linkServiceAreas(
  prisma: PrismaClient,
  vendorProfileId: string,
  cityIds: string[]
): Promise<number> {
  let linked = 0;

  for (const cityId of cityIds) {
    // Check if service area already exists
    const existing = await prisma.serviceArea.findFirst({
      where: {
        vendorProfileId,
        cityId,
      },
    });

    if (!existing) {
      if (!DRY_RUN) {
        await prisma.serviceArea.create({
          data: {
            id: randomUUID(),
            vendorProfileId,
            cityId,
          },
        });
      }
      linked++;
    }
  }

  return linked;
}

async function linkAddress(
  prisma: PrismaClient,
  vendorProfileId: string,
  addressString: string,
  cityMap: Map<string, CityMapping>
): Promise<boolean> {
  // Check if vendor already has an address linked
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorProfileId },
    select: { addressId: true },
  });

  if (vendor?.addressId) {
    // Already has address, skip
    return false;
  }

  // Extract city from address
  const cityHint = extractCityFromAddress(addressString);
  let cityId: string | null = null;

  if (cityHint && cityMap.has(cityHint)) {
    cityId = cityMap.get(cityHint)!.cityId;
  } else {
    // Default to Chandigarh if can't determine
    const chandigarh = cityMap.get('Chandigarh');
    if (chandigarh) {
      cityId = chandigarh.cityId;
    }
  }

  if (!cityId) return false;

  // Create address
  if (!DRY_RUN) {
    const address = await prisma.address.create({
      data: {
        id: randomUUID(),
        addressLine1: addressString.substring(0, 255),
        cityId,
      },
    });

    // Link to vendor profile
    await prisma.vendorProfile.update({
      where: { id: vendorProfileId },
      data: { addressId: address.id },
    });
  }

  return true;
}

async function linkTags(
  prisma: PrismaClient,
  vendorProfileId: string,
  tags: string[]
): Promise<number> {
  let linked = 0;

  for (const tagName of tags) {
    const tagSlug = generateSlug(tagName);
    if (!tagSlug) continue;

    // Find or create tag
    let tag = await prisma.tag.findFirst({
      where: { slug: tagSlug },
    });

    if (!tag && !DRY_RUN) {
      tag = await prisma.tag.create({
        data: {
          id: randomUUID(),
          name: tagName.trim(),
          slug: tagSlug,
        },
      });
    }

    if (!tag) continue;

    // Check if vendor-tag link already exists
    const existingLink = await prisma.vendorTag.findFirst({
      where: {
        vendorProfileId,
        tagId: tag.id,
      },
    });

    if (!existingLink) {
      if (!DRY_RUN) {
        await prisma.vendorTag.create({
          data: {
            id: randomUUID(),
            vendorProfileId,
            tagId: tag.id,
          },
        });
      }
      linked++;
    }
  }

  return linked;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function runLinkingScript(): Promise<void> {
  console.log('='.repeat(70));
  console.log('LINK VENDOR DATA SCRIPT');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const prisma = createPrismaClient();

  try {
    // Step 1: Read backup data
    console.log('\n[1/5] Reading backup data...');
    const oldProfiles = readBackupCollection<OldVendorProfile>('VendorProfile');
    console.log(`   Found ${oldProfiles.length} vendor profiles in backup`);

    // Step 2: Get existing vendor profiles from database
    console.log('\n[2/5] Fetching existing vendor profiles from database...');
    const existingVendors = await prisma.vendorProfile.findMany({
      select: {
        id: true,
        slug: true,
        businessName: true,
        addressId: true,
        serviceAreas: { select: { cityId: true } },
        tags: { select: { tagId: true } },
      },
    });
    console.log(`   Found ${existingVendors.length} vendor profiles in database`);

    // Create slug -> vendor map
    const vendorBySlug = new Map(existingVendors.map(v => [v.slug, v]));

    // Step 3: Collect all unique city names needed
    console.log('\n[3/5] Analyzing city data...');
    const allCityNames = new Set<string>();

    for (const oldProfile of oldProfiles) {
      if (oldProfile.serviceCities) {
        const cities = normalizeCityName(oldProfile.serviceCities);
        cities.forEach(c => allCityNames.add(c));
      }
      if (oldProfile.address) {
        const cityFromAddr = extractCityFromAddress(oldProfile.address);
        if (cityFromAddr) allCityNames.add(cityFromAddr);
      }
    }

    console.log(`   Unique cities found: ${Array.from(allCityNames).join(', ')}`);

    // Step 4: Ensure all cities exist
    console.log('\n[4/5] Ensuring cities exist in database...');
    const cityMap = await ensureCitiesExist(prisma, Array.from(allCityNames));
    console.log(`   Cities ready: ${cityMap.size}`);

    // Step 5: Link data to each vendor
    console.log('\n[5/5] Linking data to vendors...');

    let vendorsProcessed = 0;
    let vendorsMatched = 0;
    let serviceAreasLinked = 0;
    let addressesLinked = 0;
    let tagsLinked = 0;
    const unmatchedVendors: string[] = [];

    for (const oldProfile of oldProfiles) {
      vendorsProcessed++;

      // Match by slug
      const slug = oldProfile.slug;
      if (!slug) continue;

      const existingVendor = vendorBySlug.get(slug);
      if (!existingVendor) {
        unmatchedVendors.push(slug);
        continue;
      }

      vendorsMatched++;

      // Link service areas
      if (oldProfile.serviceCities) {
        const normalizedCities = normalizeCityName(oldProfile.serviceCities);
        const cityIds = normalizedCities
          .map(c => cityMap.get(c)?.cityId)
          .filter((id): id is string => !!id);

        const linkedAreas = await linkServiceAreas(prisma, existingVendor.id, cityIds);
        serviceAreasLinked += linkedAreas;
      }

      // Link address
      if (oldProfile.address && !existingVendor.addressId) {
        const linked = await linkAddress(prisma, existingVendor.id, oldProfile.address, cityMap);
        if (linked) addressesLinked++;
      }

      // Link tags
      if (oldProfile.tags && oldProfile.tags.length > 0) {
        const linked = await linkTags(prisma, existingVendor.id, oldProfile.tags);
        tagsLinked += linked;
      }

      // Progress
      if (vendorsProcessed % 10 === 0) {
        process.stdout.write(`   Processed ${vendorsProcessed}/${oldProfiles.length}...\r`);
      }
    }

    // Summary
    console.log('\n');
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Mode:                    ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Vendors in backup:       ${oldProfiles.length}`);
    console.log(`Vendors in database:     ${existingVendors.length}`);
    console.log(`Vendors matched:         ${vendorsMatched}`);
    console.log(`Vendors unmatched:       ${unmatchedVendors.length}`);
    console.log(`Service areas linked:    ${serviceAreasLinked}`);
    console.log(`Addresses linked:        ${addressesLinked}`);
    console.log(`Tags linked:             ${tagsLinked}`);
    console.log('='.repeat(70));

    if (unmatchedVendors.length > 0 && unmatchedVendors.length <= 20) {
      console.log('\nUnmatched vendor slugs:');
      unmatchedVendors.forEach(s => console.log(`   - ${s}`));
    } else if (unmatchedVendors.length > 20) {
      console.log(`\nFirst 20 unmatched vendor slugs:`);
      unmatchedVendors.slice(0, 20).forEach(s => console.log(`   - ${s}`));
      console.log(`   ... and ${unmatchedVendors.length - 20} more`);
    }

    if (DRY_RUN) {
      console.log('\n*** DRY RUN COMPLETE - No changes were made ***');
      console.log('Run without --dry-run flag to apply changes.');
    } else {
      console.log('\nLinking complete!');
    }

  } catch (error) {
    console.error('\nERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// RUN
// ============================================================================

runLinkingScript()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
