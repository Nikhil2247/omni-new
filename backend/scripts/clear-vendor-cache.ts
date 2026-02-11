/**
 * Script to clear vendor cache from Dragonfly/Redis
 * Run with: npx ts-node scripts/clear-vendor-cache.ts
 * Or: npx ts-node scripts/clear-vendor-cache.ts <vendor-slug>
 */

import Redis from 'ioredis'

async function clearVendorCache() {
  const host = process.env.DRAGONFLY_HOST || 'localhost'
  const port = parseInt(process.env.DRAGONFLY_PORT || '6379', 10)
  const password = process.env.DRAGONFLY_PASSWORD || undefined
  const keyPrefix = process.env.CACHE_KEY_PREFIX || 'omni:'

  const client = new Redis({
    host,
    port,
    password,
    lazyConnect: true,
  })

  try {
    await client.connect()
    console.log(`Connected to Dragonfly at ${host}:${port}`)

    const slug = process.argv[2]

    if (slug) {
      // Clear specific vendor cache
      const key = `${keyPrefix}vendor:slug:${slug}`
      const result = await client.del(key)
      console.log(`Deleted cache for vendor slug "${slug}": ${result > 0 ? 'success' : 'key not found'}`)
    } else {
      // Clear all vendor slug caches
      const pattern = `${keyPrefix}vendor:slug:*`
      const keys = await client.keys(pattern)

      if (keys.length === 0) {
        console.log('No vendor cache keys found')
      } else {
        const result = await client.del(...keys)
        console.log(`Deleted ${result} vendor cache keys`)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.quit()
    console.log('Disconnected from Dragonfly')
  }
}

clearVendorCache()
