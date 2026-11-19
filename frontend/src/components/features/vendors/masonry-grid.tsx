'use client'

import { useMemo, useRef, useSyncExternalStore } from 'react'
import { motion, useInView } from 'framer-motion'
import { PortfolioMediaCard } from './portfolio-media-card'
import type { PortfolioMediaItem } from '@/lib/api/types/portfolio-media.types'
import { Skeleton } from '@/components/ui/skeleton'
import { cardAspect } from '@/lib/utils/masonry'

interface MasonryGridProps {
  items: PortfolioMediaItem[]
  isLoading?: boolean
  boostedVendorIds?: Set<string>
}

const ease = [0.22, 1, 0.36, 1] as const

// Columns by viewport width (same breakpoints the old CSS columns used).
const COLUMN_BREAKPOINTS: Array<[minWidth: number, columns: number]> = [
  [1536, 6],
  [1280, 5],
  [1024, 4],
  [768, 3],
  [0, 2],
]

function columnCountForWidth(width: number) {
  return COLUMN_BREAKPOINTS.find(([min]) => width >= min)?.[1] ?? 2
}

function subscribeToResize(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/** Number of masonry columns. The snapshot is a number, so it only re-renders when the count actually changes. */
function useColumnCount() {
  return useSyncExternalStore(
    subscribeToResize,
    () => columnCountForWidth(window.innerWidth),
    () => 2,
  )
}

/**
 * Splits items into columns, always dropping the next item into the currently shortest column.
 * The result for item N depends only on items before it, so appending a new page never moves existing cards.
 * (CSS `columns` re-balances every item on each append, which made the list jump.)
 */
function distribute(items: PortfolioMediaItem[], count: number) {
  const columns: Array<Array<{ item: PortfolioMediaItem; index: number }>> = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)
  items.forEach((item, index) => {
    let shortest = 0
    for (let c = 1; c < count; c++) if (heights[c] < heights[shortest] - 0.001) shortest = c
    columns[shortest].push({ item, index })
    heights[shortest] += cardAspect(item) + 0.04 // + a little for the gap/borders
  })
  return columns
}

// Animated wrapper for each masonry item
function AnimatedMasonryItem({
  children,
  index
}: {
  children: React.ReactNode
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min((index % 30) * 0.02, 0.18),
        ease
      }}
      style={{ willChange: 'opacity, transform' }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

// Loading skeleton with varied heights for Pinterest effect
function LoadingSkeleton() {
  const heights = [280, 320, 240, 360, 300, 260, 340, 280, 320, 380, 260, 300]

  return (
    <div className="columns-2 min-[480px]:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 sm:gap-3">
      {heights.map((height, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="break-inside-avoid mb-1.5 sm:mb-2"
        >
          <Skeleton
            className="w-full rounded-xl sm:rounded-2xl"
            style={{ height: `${height}px` }}
          />
        </motion.div>
      ))}
    </div>
  )
}

export function MasonryGrid({
  items,
  isLoading = false,
  boostedVendorIds,
}: MasonryGridProps) {
  const columnCount = useColumnCount()
  const columns = useMemo(() => distribute(items, columnCount), [items, columnCount])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No items to display
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      {columns.map((column, c) => (
        <div key={c} className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
          {column.map(({ item, index }) => (
            <AnimatedMasonryItem key={item.id} index={index}>
              <PortfolioMediaCard
                item={item}
                priority={index < 4}
                isBoosted={boostedVendorIds?.has(item.vendor.id) === true}
              />
            </AnimatedMasonryItem>
          ))}
        </div>
      ))}
    </div>
  )
}
