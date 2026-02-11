'use client'

import { useState, useRef, ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)

  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1])
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1])
  const indicatorRotate = useTransform(y, [0, threshold], [0, 180])

  const handleDrag = (_: any, info: PanInfo) => {
    // Only allow pull when at top of scroll
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      y.set(0)
      return
    }

    // Only track downward movement
    if (info.offset.y > 0 && !isRefreshing) {
      y.set(Math.min(info.offset.y * 0.5, threshold * 1.5))
    }
  }

  const handleDragEnd = async () => {
    const currentY = y.get()

    if (currentY >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      y.set(threshold)

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        y.set(0)
      }
    } else {
      y.set(0)
    }
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Refresh indicator */}
      <motion.div
        className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center py-4"
        style={{
          opacity: indicatorOpacity,
          y: useTransform(y, [0, threshold], [-40, 0]),
        }}
      >
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
          style={{ scale: indicatorScale }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <motion.svg
              className="h-5 w-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{ rotate: indicatorRotate }}
            >
              <path d="M12 5v14M5 12l7-7 7 7" />
            </motion.svg>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        className="h-full overflow-auto"
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}
