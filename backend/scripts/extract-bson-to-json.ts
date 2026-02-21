// ============================================================================
// MONGODB ARCHIVE TO JSON EXTRACTOR
// ============================================================================
// Extracts MongoDB archive backup and converts to JSON
// Run: npx ts-node scripts/extract-bson-to-json.ts
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { execSync, spawnSync } from 'child_process';
import * as BSON from 'bson';

const BACKUP_FILE = 'D:\\backup\\backup-20-02-2026.gz';
const EXTRACTED_DIR = 'D:\\backup\\extracted';
const JSON_DIR = 'D:\\backup\\extracted\\json';
const TEMP_DB = 'omnicassion_temp_migration';

// Collections to extract
const COLLECTIONS = ['User', 'VendorProfile', 'Review', 'Menu', 'Story', 'Blog', 'Partner'];

async function checkMongoTools(): Promise<boolean> {
  try {
    const result = spawnSync('mongorestore', ['--version'], { encoding: 'utf-8' });
    if (result.status === 0) {
      console.log('✅ MongoDB tools found');
      return true;
    }
  } catch {}
  return false;
}

async function extractUsingMongoRestore(): Promise<void> {
  console.log('📦 Extracting using mongorestore...');
  console.log('   This will restore to a temporary local MongoDB instance');

  // Create directories
  if (!fs.existsSync(EXTRACTED_DIR)) {
    fs.mkdirSync(EXTRACTED_DIR, { recursive: true });
  }
  if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
  }

  // Restore to temporary database
  console.log(`\n   Restoring archive to temporary database: ${TEMP_DB}`);

  try {
    execSync(
      `mongorestore --archive="${BACKUP_FILE}" --gzip --nsFrom="omnicassion.*" --nsTo="${TEMP_DB}.*" --drop`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    throw new Error('mongorestore failed. Make sure MongoDB is running locally.');
  }

  // Export each collection to JSON
  console.log('\n📝 Exporting collections to JSON...');

  for (const collection of COLLECTIONS) {
    console.log(`   Exporting: ${collection}`);
    const outputFile = path.join(JSON_DIR, `${collection}.json`);

    try {
      execSync(
        `mongoexport --db=${TEMP_DB} --collection=${collection} --out="${outputFile}" --jsonArray`,
        { stdio: 'pipe' }
      );

      if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        console.log(`   ✅ ${collection}.json (${Math.round(stats.size / 1024)}KB)`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${collection} - not found or empty`);
    }
  }

  // Cleanup temporary database
  console.log(`\n🧹 Cleaning up temporary database: ${TEMP_DB}`);
  try {
    execSync(`mongosh ${TEMP_DB} --eval "db.dropDatabase()"`, { stdio: 'pipe' });
  } catch {
    console.log('   ⚠️  Could not drop temp database (you can do it manually)');
  }
}

// MongoDB archive format parser
// The archive format is:
// 1. Archive header (magic bytes + metadata BSON)
// 2. For each namespace (db.collection):
//    - Namespace header BSON document
//    - Collection documents (BSON)
//    - EOF marker

interface ArchiveHeader {
  concurrent_collections: number;
  version: string;
  server_version: string;
  tool_version: string;
}

interface NamespaceHeader {
  db: string;
  collection: string;
  metadata: string;
  size: number;
  type: string;
}

function parseMongoArchive(data: Buffer): Map<string, any[]> {
  const collections = new Map<string, any[]>();
  let offset = 0;

  console.log('\n   Parsing MongoDB archive format...');

  // MongoDB archive format has:
  // 1. Header BSON document
  // 2. Namespace metadata headers for all collections
  // 3. Data blocks: each starts with a block header containing "db..omnicassion..collection..NAME"
  //    followed by BSON documents, ending with EOF marker

  // Find and parse the archive header first
  let headerFound = false;
  while (offset < Math.min(data.length - 4, 1000)) {
    const size = data.readInt32LE(offset);
    if (size > 50 && size < 500 && offset + size <= data.length && data[offset + size - 1] === 0x00) {
      try {
        const doc = BSON.deserialize(data.subarray(offset, offset + size));
        if (doc.concurrent_collections !== undefined) {
          console.log(`   Archive version: ${doc.version}`);
          console.log(`   Server version: ${doc.server_version}`);
          console.log(`   Tool version: ${doc.tool_version}`);
          offset += size;
          headerFound = true;
          break;
        }
      } catch {}
    }
    offset++;
  }

  if (!headerFound) {
    console.log('   ⚠️  Archive header not found, trying from start');
    offset = 0;
  }

  // Skip namespace metadata headers (they all start with db=omnicassion, collection=X, metadata=...)
  // These are informational, actual data comes after with block headers

  // Look for data block patterns: "db\x00....omnicassion\x00.collection\x00....CollectionName"
  let currentCollection = '';
  const collectionCounts = new Map<string, number>();

  while (offset < data.length - 4) {
    // Check for block header pattern: look for "omnicassion" followed by "collection"
    // Block headers are BSON documents with {db, collection, EOF, CRC} fields
    const chunk = data.subarray(offset, Math.min(offset + 200, data.length));
    const chunkStr = chunk.toString('utf8', 0, Math.min(150, chunk.length));

    // Check if this looks like a block header
    if (chunkStr.includes('omnicassion') && chunkStr.includes('collection') && chunkStr.includes('EOF')) {
      // Extract collection name from the block header
      const collMatch = chunkStr.match(/collection[\x00-\x20]+([A-Za-z]+)/);
      if (collMatch) {
        currentCollection = collMatch[1];
        if (!collections.has(currentCollection)) {
          collections.set(currentCollection, []);
          collectionCounts.set(currentCollection, 0);
        }
        // Skip this block header (variable size, find next BSON doc)
        offset += 50; // Skip past the block header approximately
        continue;
      }
    }

    // Try to parse as BSON document
    const size = data.readInt32LE(offset);

    // Valid BSON size range
    if (size <= 4 || size > 16 * 1024 * 1024 || offset + size > data.length) {
      offset++;
      continue;
    }

    // BSON must end with 0x00
    if (data[offset + size - 1] !== 0x00) {
      offset++;
      continue;
    }

    try {
      const docBuffer = data.subarray(offset, offset + size);
      const doc = BSON.deserialize(docBuffer, {
        promoteBuffers: true,
        bsonRegExp: true,
      });

      // Skip namespace metadata headers
      if (doc.db === 'omnicassion' && doc.collection && doc.metadata !== undefined) {
        offset += size;
        continue;
      }

      // Skip block headers (have EOF and CRC fields)
      if (doc.db && doc.collection && doc.EOF !== undefined) {
        currentCollection = doc.collection;
        if (!collections.has(currentCollection)) {
          collections.set(currentCollection, []);
          collectionCounts.set(currentCollection, 0);
        }
        offset += size;
        continue;
      }

      // Regular document: has _id field
      if (doc._id !== undefined && currentCollection) {
        const jsonDoc = convertBsonToJson(doc);
        collections.get(currentCollection)?.push(jsonDoc);
        collectionCounts.set(currentCollection, (collectionCounts.get(currentCollection) || 0) + 1);
        offset += size;
        continue;
      }

      // Unknown document, skip
      offset += size;
    } catch (err) {
      offset++;
    }
  }

  // Print collection counts
  console.log('\n   Collections found:');
  for (const [name, count] of collectionCounts) {
    if (count > 0) {
      console.log(`   ✅ ${name}: ${count} documents`);
    }
  }

  return collections;
}

// Convert BSON-specific types to JSON-friendly format
function convertBsonToJson(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof BSON.ObjectId) {
    return { $oid: obj.toString() };
  }

  if (obj instanceof Date) {
    return { $date: obj.toISOString() };
  }

  if (obj instanceof BSON.Binary) {
    return { $binary: obj.toString('base64') };
  }

  if (obj instanceof BSON.Decimal128) {
    return { $numberDecimal: obj.toString() };
  }

  if (obj instanceof BSON.Long) {
    return { $numberLong: obj.toString() };
  }

  if (obj instanceof BSON.Int32) {
    return obj.valueOf();
  }

  if (obj instanceof BSON.Double) {
    return obj.valueOf();
  }

  if (Buffer.isBuffer(obj)) {
    return { $binary: obj.toString('base64') };
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBsonToJson(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = convertBsonToJson(obj[key]);
    }
    return result;
  }

  return obj;
}

async function extractManually(): Promise<void> {
  console.log('📦 Extracting MongoDB archive manually...');
  console.log('   (Using BSON library to parse archive)');

  // Create directories
  if (!fs.existsSync(EXTRACTED_DIR)) {
    fs.mkdirSync(EXTRACTED_DIR, { recursive: true });
  }
  if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
  }

  // Read and decompress the archive
  console.log('\n   Decompressing archive...');
  const compressedData = fs.readFileSync(BACKUP_FILE);
  const decompressedData = zlib.gunzipSync(compressedData);

  console.log(`   Decompressed size: ${Math.round(decompressedData.length / 1024)}KB`);

  // Parse the MongoDB archive
  const collections = parseMongoArchive(decompressedData);

  // Write collections to JSON files
  console.log('\n📝 Writing JSON files...');

  let totalDocs = 0;
  for (const [collectionName, documents] of collections) {
    if (documents.length > 0) {
      const outputFile = path.join(JSON_DIR, `${collectionName}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2));
      console.log(`   ✅ ${collectionName}.json (${documents.length} documents)`);
      totalDocs += documents.length;
    }
  }

  if (totalDocs === 0) {
    console.log('\n⚠️  Could not extract documents from the archive.');
    console.log('   Please start MongoDB locally and run this script again,');
    console.log('   or manually restore the backup:');
    console.log(`   mongorestore --archive="${BACKUP_FILE}" --gzip`);
  } else {
    console.log(`\n   Total: ${totalDocs} documents extracted`);
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('MongoDB Archive to JSON Extractor');
  console.log('='.repeat(60));
  console.log(`Backup file: ${BACKUP_FILE}`);
  console.log(`Output dir: ${JSON_DIR}`);
  console.log('='.repeat(60));

  // Check if backup exists
  if (!fs.existsSync(BACKUP_FILE)) {
    throw new Error(`Backup file not found: ${BACKUP_FILE}`);
  }

  // Check file type
  const header = fs.readFileSync(BACKUP_FILE).subarray(0, 2);
  const isGzip = header[0] === 0x1f && header[1] === 0x8b;

  if (!isGzip) {
    throw new Error('Backup file is not gzip compressed');
  }

  console.log('✅ Backup file is gzip compressed');

  // Try MongoDB tools first
  const hasMongoTools = await checkMongoTools();

  if (hasMongoTools) {
    try {
      await extractUsingMongoRestore();
    } catch (error: any) {
      console.log(`\n⚠️  MongoDB restore failed: ${error.message}`);
      console.log('   Falling back to manual extraction...\n');
      await extractManually();
    }
  } else {
    console.log('\n⚠️  MongoDB tools not found in PATH');
    console.log('   Attempting manual extraction...\n');
    await extractManually();
  }

  // List extracted files
  console.log('\n' + '='.repeat(60));
  console.log('EXTRACTION COMPLETE');
  console.log('='.repeat(60));

  if (fs.existsSync(JSON_DIR)) {
    const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
      console.log('JSON files extracted:');
      files.forEach(f => {
        const filePath = path.join(JSON_DIR, f);
        const stats = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log(`   - ${f} (${Array.isArray(content) ? content.length : 0} docs, ${Math.round(stats.size / 1024)}KB)`);
      });
      console.log('\nNext step: Run the migration script:');
      console.log('   npm run migrate:mongodb');
    } else {
      console.log('No JSON files were extracted.');
      console.log('\nPlease start MongoDB and try again:');
      console.log('   1. Start MongoDB server locally');
      console.log('   2. Run: npm run migrate:extract');
    }
  }

  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  });
