const MINIO_PUBLIC_URL = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL || 'https://files.omnicassion.com'
const MINIO_ENDPOINT = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost'
const MINIO_PORT = process.env.NEXT_PUBLIC_MINIO_PORT || '9000'
const MINIO_BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'omnicassion'
const CDN_ENABLED = process.env.NEXT_PUBLIC_CDN_ENABLED === 'true'
const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL || ''

const normalizedMinioEndpoint = MINIO_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/$/, '')
const normalizedPublicBaseUrl = MINIO_PUBLIC_URL
  ? MINIO_PUBLIC_URL.replace(/\/+$/, '')
  : `http://${normalizedMinioEndpoint}:${MINIO_PORT}`

/**
 * Build direct public object URL from object path
 */
const toPublicObjectUrl = (objectPath: string): string => {
  const normalizedPath = objectPath.replace(/^\/+/, '')
  const pathWithoutBucket = normalizedPath.startsWith(`${MINIO_BUCKET}/`)
    ? normalizedPath.slice(MINIO_BUCKET.length + 1)
    : normalizedPath

  return `${normalizedPublicBaseUrl}/${MINIO_BUCKET}/${pathWithoutBucket}`
}

/**
 * Check if URL has AWS/MinIO presigned parameters
 */
const hasPresignedParams = (url: string) =>
  /[?&]X-Amz-(Algorithm|Signature|Credential|Date)=/i.test(url)

/**
 * Check if URL is a MinIO URL (localhost or configured endpoint)
 */
const isMinioUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    const minioHosts = [
      'localhost',
      '127.0.0.1',
      normalizedMinioEndpoint,
      `${normalizedMinioEndpoint}:${MINIO_PORT}`,
    ]
    const isKnownHost = minioHosts.some(host =>
      urlObj.host === host ||
      urlObj.host === `${host}:${MINIO_PORT}`
    )

    // MinIO commonly serves on 9000, even when accessed via public IP/hostname
    const isMinioPort = urlObj.port === MINIO_PORT

    // Bucket-style path heuristic for non-configured hosts
    const hasBucketLikePath = pathParts.length >= 2 && pathParts[0] === MINIO_BUCKET

    return isKnownHost || isMinioPort || hasBucketLikePath
  } catch {
    return false
  }
}

/**
 * Check if URL is an external URL (not MinIO)
 */
const isExternalUrl = (url: string): boolean => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false
  }
  return !isMinioUrl(url)
}

/**
 * Check if the path looks like a MinIO object path (not a full URL)
 */
const isMinioPath = (pathOrUrl: string): boolean => {
  // If it starts with http, it's a URL, not a path
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return false
  }
  // MinIO paths typically look like: bucket/folder/file.ext or folder/file.ext
  return /^[\w-]+\/[\w\-/.]+\.\w+$/.test(pathOrUrl) || pathOrUrl.includes('/')
}

/**
 * Get the viewable URL for media files.
 * Handles:
 * - CDN URLs (if CDN is enabled) - returned with CDN base URL
 * - External URLs (Unsplash, etc.) - returned as-is
 * - Already presigned MinIO URLs - returned as-is
 * - MinIO object paths - returns direct MinIO public URL or CDN URL
 * - Direct MinIO URLs without presigning - returned as-is
 *
 * @param pathOrUrl - The file path or URL
 * @param options - Optional settings
 * @returns The viewable URL or null
 */
export const getMinioViewUrl = (
  pathOrUrl?: string | null,
  options?: { expiresIn?: number; useCdn?: boolean }
): string | null => {
  if (!pathOrUrl) return null

  // If it's an external URL (like Unsplash), return as-is
  if (isExternalUrl(pathOrUrl)) {
    return pathOrUrl
  }

  // If CDN is enabled and useCdn is not explicitly false
  const shouldUseCdn = CDN_ENABLED && options?.useCdn !== false

  // If it already has presigned params, return as-is
  if (pathOrUrl.startsWith('http') && hasPresignedParams(pathOrUrl)) {
    return pathOrUrl
  }

  // If it's a MinIO URL, return direct URL (or CDN URL when enabled)
  if (isMinioUrl(pathOrUrl)) {
    try {
      const urlObj = new URL(pathOrUrl)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        const bucket = pathParts[0]
        const objectPath = pathParts.slice(1).join('/')
        
        if (shouldUseCdn && CDN_BASE_URL) {
          return `${CDN_BASE_URL}/${objectPath}`
        }

        if (bucket === MINIO_BUCKET) {
          return pathOrUrl
        }

        return `${normalizedPublicBaseUrl}/${bucket}/${objectPath}`
      }
    } catch {
      // Fall through to treat as path
    }
  }

  // If it's a MinIO path (not a URL)
  if (isMinioPath(pathOrUrl) || !pathOrUrl.startsWith('http')) {
    // Use CDN if enabled
    if (shouldUseCdn && CDN_BASE_URL) {
      return `${CDN_BASE_URL}/${pathOrUrl}`
    }

    // Otherwise, return direct public MinIO URL
    return toPublicObjectUrl(pathOrUrl)
  }

  // Fallback: return as-is if none of the above conditions match
  return pathOrUrl
}

/**
 * Get the best available image URL from multiple options.
 * Prioritizes: cdnUrl > url > thumbnailUrl
 *
 * @param media - Object with url, cdnUrl, thumbnailUrl properties
 * @param options - Optional settings for presigned URL generation
 * @returns The best available URL
 */
export const getBestImageUrl = (
  media?: { url?: string | null; cdnUrl?: string | null; thumbnailUrl?: string | null } | null,
  options?: { expiresIn?: number; preferThumbnail?: boolean; useCdn?: boolean }
): string | null => {
  if (!media) return null

  // Prioritize cdnUrl if available and CDN is enabled
  if (CDN_ENABLED && media.cdnUrl) {
    return getMinioViewUrl(media.cdnUrl, options)
  }

  const url = options?.preferThumbnail
    ? media.thumbnailUrl || media.url || media.cdnUrl
    : media.url || media.thumbnailUrl || media.cdnUrl

  return getMinioViewUrl(url, options)
}

/**
 * Check if an image URL needs to go through the MinIO proxy
 */
export const needsMinioProxy = (url?: string | null): boolean => {
  return false
}
