'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedHeartProps {
  isLiked?: boolean
  onToggle?: (liked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  showParticles?: boolean
  className?: string
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const buttonSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

export function AnimatedHeart({
  isLiked = false,
  onToggle,
  size = 'md',
  showParticles = true,
  className,
}: AnimatedHeartProps) {
  const [particles, setParticles] = useState<number[]>([])

  const handleClick = () => {
    const newLiked = !isLiked
    onToggle?.(newLiked)

    if (newLiked && showParticles) {
      // Create particle burst
      setParticles(Array.from({ length: 6 }, (_, i) => i))
      setTimeout(() => setParticles([]), 700)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-colors',
        'hover:bg-pink-100/50 dark:hover:bg-pink-900/30',
        buttonSizes[size],
        className
      )}
    >
      {/* Particles */}
      <AnimatePresence>
        {particles.map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0.5],
              x: Math.cos((i * Math.PI * 2) / 6) * 25,
              y: Math.sin((i * Math.PI * 2) / 6) * 25,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute h-1.5 w-1.5 rounded-full bg-pink-500"
          />
        ))}
      </AnimatePresence>

      {/* Ring burst */}
      <AnimatePresence>
        {particles.length > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-full border-2 border-pink-400"
          />
        )}
      </AnimatePresence>

      {/* Heart icon */}
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(
            sizes[size],
            'transition-colors duration-200',
            isLiked
              ? 'fill-pink-500 text-pink-500'
              : 'text-muted-foreground hover:text-pink-400'
          )}
        />
      </motion.div>
    </motion.button>
  )
}

// Double-tap to like wrapper
interface DoubleTapLikeProps {
  children: React.ReactNode
  onDoubleTap?: () => void
  isLiked?: boolean
}

export function DoubleTapLike({ children, onDoubleTap, isLiked }: DoubleTapLikeProps) {
  const [showHeart, setShowHeart] = useState(false)

  const handleDoubleTap = () => {
    if (!isLiked) {
      onDoubleTap?.()
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 1000)
    }
  }

  return (
    <div className="relative" onDoubleClick={handleDoubleTap}>
      {children}

      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <Heart className="h-20 w-20 fill-white text-white drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
