import * as dotenv from 'dotenv';
dotenv.config();

import Redis from 'ioredis';

async function invalidateCache() {
  const host = process.env.DRAGONFLY_HOST || process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.DRAGONFLY_PORT || process.env.REDIS_PORT || '6379');
  const password = process.env.DRAGONFLY_PASSWORD || process.env.REDIS_PASSWORD;
  const keyPrefix = process.env.CACHE_KEY_PREFIX || 'omni:';

  console.log(`Connecting to Redis/Dragonfly at: ${host}:${port}`);
  console.log(`Using key prefix: ${keyPrefix}`);

  const redis = new Redis({
    host,
    port,
    password: password || undefined,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
  });

  try {
    // Test connection
    const pong = await redis.ping();
    console.log(`Connected! Ping: ${pong}`);

    // The cache keys use the prefix from env (default: omni:)
    // The vendor slug cache key pattern is: omni:vendor:slug:v4:{slug}
    const patterns = [
      `${keyPrefix}vendor:slug:*:omnicassion`,
      `${keyPrefix}vendor:slug:v4:omnicassion`,
      `${keyPrefix}vendor:slug:v3:omnicassion`,
      `${keyPrefix}vendor:slug:omnicassion`,
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys matching "${pattern}":`, keys);
        const deleted = await redis.del(...keys);
        console.log(`Deleted ${deleted} keys`);
        totalDeleted += deleted;
      }
    }

    // Also try exact keys
    const exactKeys = [
      `${keyPrefix}vendor:slug:v4:omnicassion`,
      `${keyPrefix}vendor:slug:omnicassion`,
    ];

    for (const key of exactKeys) {
      const exists = await redis.exists(key);
      if (exists) {
        const deleted = await redis.del(key);
        console.log(`Deleted exact key "${key}": ${deleted}`);
        totalDeleted += deleted;
      }
    }

    // List all vendor:slug keys for reference
    const allVendorKeys = await redis.keys(`${keyPrefix}vendor:slug:*`);
    console.log('\nAll vendor:slug keys in cache:', allVendorKeys.length > 0 ? allVendorKeys : 'None');

    console.log(`\nTotal keys deleted: ${totalDeleted}`);
    console.log('Cache invalidation complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await redis.quit();
  }
}

invalidateCache();
