import type { PortfolioMediaItem } from '@/lib/api/types/portfolio-media.types'

/**
 * Card shapes (height / width) handed to landscape photos so the gallery has tall, square and medium cards
 * instead of one row of short ones. Most uploads are landscape, which would otherwise make nearly every card short.
 * The mix leans tall; it is a fixed cycle indexed by a hash of the item id, so a given image always gets the same
 * shape (nothing re-shuffles while scrolling) and the shapes are evenly spread.
 */
const CROP_ASPECTS = [1.5, 1.0, 1.25, 1.4, 0.82, 1.25, 1.0, 1.6, 1.15, 1.35, 0.75, 1.25, 1.5, 1.0, 1.4, 1.2, 0.9, 1.3, 1.55, 1.1]

function hash(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Natural height / width of an item, or null when the dimensions are unknown. */
export function naturalAspect(item: PortfolioMediaItem): number | null {
  return item.width && item.height ? item.height / item.width : null
}

/** The card shape (height / width) to display this item at. */
export function cardAspect(item: PortfolioMediaItem): number {
  const natural = naturalAspect(item)
  // Portrait or square photos keep their own shape (capped so a very tall one cannot dominate a column).
  if (natural !== null && natural >= 0.95) return Math.min(natural, 1.7)
  return CROP_ASPECTS[hash(item.id) % CROP_ASPECTS.length]
}

/**
 * How much wider than the card the image must be so object-cover can fill it without upscaling.
 * A landscape photo cropped into a tall card is scaled up by its height, so it needs more source pixels.
 */
export function cropScale(item: PortfolioMediaItem): number {
  const natural = naturalAspect(item) ?? 0.75
  return Math.max(1, cardAspect(item) / natural)
}
