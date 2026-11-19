/**
 * Asks Cloudinary for a right-sized, modern-format copy of an image (f_auto = WebP/AVIF, q_auto = tuned quality,
 * w_ = max width). Non-Cloudinary URLs, and URLs that already carry a transformation, are returned untouched.
 * Raw uploads can be 800 KB+ JPGs; a card shown at ~400px only needs a small fraction of that.
 */
export function optimizeImageUrl(url: string | null | undefined, width = 640): string {
  if (!url) return ''
  const marker = '/image/upload/'
  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) return url
  const [head, tail] = url.split(marker)
  // Already transformed (e.g. "w_300,c_fill/…" or "f_auto/…")? Leave it alone.
  if (/^(?:[a-z]{1,3}_[^/,]+,?)+\//.test(tail)) return url
  return `${head}${marker}f_auto,q_auto,w_${width},c_limit/${tail}`
}
