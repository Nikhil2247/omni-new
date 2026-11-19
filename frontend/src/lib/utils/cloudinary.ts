/**
 * Responsive delivery for remote images (Cloudinary for older uploads, MinIO for newer ones).
 *
 * `cloudinaryLoader` is a next/image loader: Next builds a srcset from the component's `sizes`, and each width is
 * served as a right-sized copy (f_auto picks the smallest of WebP/AVIF/JPEG, q_auto tunes quality, c_limit never
 * upscales). Raw uploads can be 800 KB+ JPEGs; a card shown at ~300px only needs a small fraction of that.
 *
 * MinIO is plain storage and cannot resize, and uploads can be up to 2560px wide. Those URLs go through Next's own
 * image optimizer instead (resized WebP/AVIF, cached on the server) via the `images.remotePatterns` allow-list.
 *
 * Use `imageDelivery(src)` and spread it onto <Image>. Cloudinary URLs get the loader, MinIO URLs use the Next
 * optimizer, and anything else is left as is. Always pass a realistic `sizes` so the right width is chosen.
 */
const OPTIMIZER_HOSTS = new Set([
  'files.omnicassion.com',
  'backend.omnicassion.com',
  'omnicassion.s3.ap-south-1.amazonaws.com',
])

function usesNextOptimizer(url?: string | null): boolean {
  if (!url) return false
  // Signed URLs expire and carry a unique query string, so they cannot be cached or allow-listed sensibly.
  if (/[?&]X-Amz-/i.test(url)) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && OPTIMIZER_HOSTS.has(u.hostname)
  } catch {
    return false
  }
}

const MARKER = '/image/upload/'

export const isCloudinaryUrl = (url?: string | null): url is string =>
  !!url && url.includes('res.cloudinary.com') && url.includes(MARKER)

// Already carries a transformation (e.g. "w_300,c_fill/…" or "f_auto/…")? Leave it alone.
const hasTransformation = (tail: string) => /^(?:[a-z]{1,3}_[^/,]+,?)+\//.test(tail)

export function cloudinaryLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!isCloudinaryUrl(src)) return src
  const [head, tail] = src.split(MARKER)
  if (hasTransformation(tail)) return src
  return `${head}${MARKER}f_auto,q_auto,w_${width},c_limit/${tail}`
}

export function imageDelivery(src?: string | null) {
  if (isCloudinaryUrl(src)) return { loader: cloudinaryLoader } as const
  if (usesNextOptimizer(src)) return { unoptimized: false } as const
  return { unoptimized: true } as const
}

/**
 * Same idea as `imageDelivery`, for SERVER components. A loader is a function and cannot be passed from a server
 * component to <Image>, so for Cloudinary the size is baked straight into the URL instead (fixed width, no srcset).
 * Spread the result onto <Image>: `<Image {...serverImageProps(url, 480)} />` (it includes `src`).
 */
export function serverImageProps(src: string, width = 480) {
  if (isCloudinaryUrl(src)) return { src: cloudinaryLoader({ src, width }), unoptimized: true } as const
  if (usesNextOptimizer(src)) return { src, unoptimized: false } as const
  return { src, unoptimized: true } as const
}
