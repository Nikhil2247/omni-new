'use client'

import { useState, ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Heart, X, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  threshold?: number
  className?: string
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  threshold = 100,
  className,
}: SwipeableCardProps) {
  const [isGone, setIsGone] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  // Indicator opacities
  const likeOpacity = useTransform(x, [0, threshold / 2, threshold], [0, 0.5, 1])
  const nopeOpacity = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.5, 0])
  const saveOpacity = useTransform(y, [-threshold, -threshold / 2, 0], [1, 0.5, 0])

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info

    // Swipe right (like)
    if (offset.x > threshold || (offset.x > 50 && velocity.x > 500)) {
      setIsGone(true)
      onSwipeRight?.()
      return
    }

    // Swipe left (nope)
    if (offset.x < -threshold || (offset.x < -50 && velocity.x < -500)) {
      setIsGone(true)
      onSwipeLeft?.()
      return
    }

    // Swipe up (save)
    if (offset.y < -threshold || (offset.y < -50 && velocity.y < -500)) {
      setIsGone(true)
      onSwipeUp?.()
      return
    }
  }

  if (isGone) return null

  return (
    <motion.div
      className={cn('relative touch-none', className)}
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Like indicator */}
      <motion.div
        className="pointer-events-none absolute right-4 top-4 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/90"
        style={{ opacity: likeOpacity }}
      >
        <Heart className="h-8 w-8 text-white" fill="white" />
      </motion.div>

      {/* Nope indicator */}
      <motion.div
        className="pointer-events-none absolute left-4 top-4 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/90"
        style={{ opacity: nopeOpacity }}
      >
        <X className="h-8 w-8 text-white" />
      </motion.div>

      {/* Save indicator */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-4 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-blue-500/90"
        style={{ opacity: saveOpacity }}
      >
        <Bookmark className="h-8 w-8 text-white" fill="white" />
      </motion.div>

      {children}
    </motion.div>
  )
}

// Swipe card stack for multiple cards
interface SwipeCardStackProps<T> {
  items: T[]
  renderCard: (item: T, index: number) => ReactNode
  onSwipeLeft?: (item: T) => void
  onSwipeRight?: (item: T) => void
  onSwipeUp?: (item: T) => void
  onEmpty?: () => void
  className?: string
}

export function SwipeCardStack<T extends { id: string | number }>({
  items,
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onEmpty,
  className,
}: SwipeCardStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const item = items[currentIndex]
    if (!item) return

    if (direction === 'left') onSwipeLeft?.(item)
    if (direction === 'right') onSwipeRight?.(item)
    if (direction === 'up') onSwipeUp?.(item)

    if (currentIndex >= items.length - 1) {
      onEmpty?.()
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const visibleCards = items.slice(currentIndex, currentIndex + 3)

  if (visibleCards.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-muted-foreground">No more items</p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {visibleCards.map((item, index) => {
        const isTop = index === 0
        const scale = 1 - index * 0.05
        const yOffset = index * 10

        return (
          <motion.div
            key={item.id}
            className="absolute inset-0"
            style={{
              zIndex: visibleCards.length - index,
            }}
            initial={false}
            animate={{
              scale,
              y: yOffset,
            }}
          >
            {isTop ? (
              <SwipeableCard
                onSwipeLeft={() => handleSwipe('left')}
                onSwipeRight={() => handleSwipe('right')}
                onSwipeUp={() => handleSwipe('up')}
              >
                {renderCard(item, currentIndex + index)}
              </SwipeableCard>
            ) : (
              <div className="pointer-events-none">
                {renderCard(item, currentIndex + index)}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Action buttons for swipe cards
interface SwipeActionsProps {
  onNope?: () => void
  onLike?: () => void
  onSave?: () => void
  disabled?: boolean
}

export function SwipeActions({ onNope, onLike, onSave, disabled }: SwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onNope}
        disabled={disabled}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-400 bg-background text-red-500 shadow-lg transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
      >
        <X className="h-6 w-6" />
      </motion.button>

      {onSave && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSave}
          disabled={disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-400 bg-background text-blue-500 shadow-lg transition-colors hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-950"
        >
          <Bookmark className="h-5 w-5" />
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        disabled={disabled}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-400 bg-background text-green-500 shadow-lg transition-colors hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-950"
      >
        <Heart className="h-6 w-6" />
      </motion.button>
    </div>
  )
}
