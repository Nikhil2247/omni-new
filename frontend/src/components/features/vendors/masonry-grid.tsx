'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { PortfolioMediaCard } from './portfolio-media-card'
import type { PortfolioMediaItem } from '@/lib/api/types/portfolio-media.types'
import { Skeleton } from '@/components/ui/skeleton'

interface MasonryGridProps {
  items: PortfolioMediaItem[]
  isLoading?: boolean
}

const ease = [0.22, 1, 0.36, 1] as const

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
      className="break-inside-avoid mb-3 sm:mb-4 lg:mb-5"
    >
      {children}
    </motion.div>
  )
}

// Loading skeleton with varied heights for Pinterest effect
function LoadingSkeleton() {
  const heights = [280, 320, 240, 360, 300, 260, 340, 280, 320, 380, 260, 300]

  return (
    <div className="columns-2 min-[480px]:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 lg:gap-5">
      {heights.map((height, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="break-inside-avoid mb-3 sm:mb-4 lg:mb-5"
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
}: MasonryGridProps) {
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
    <div className="columns-2 min-[480px]:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 lg:gap-5">
      {items.map((item, index) => (
        <AnimatedMasonryItem key={item.id} index={index}>
          <PortfolioMediaCard item={item} />
        </AnimatedMasonryItem>
      ))}
    </div>
  )
}
