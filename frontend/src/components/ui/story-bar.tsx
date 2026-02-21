'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Story {
  id: string
  title: string
  image: string
  viewed?: boolean
  isAdd?: boolean
}

interface StoryBarProps {
  stories: Story[]
  onStoryClick?: (story: Story) => void
  onAddClick?: () => void
  className?: string
}

export function StoryBar({
  stories,
  onStoryClick,
  onAddClick,
  className,
}: StoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 200
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll button */}
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-lg backdrop-blur md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Stories container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto px-4 py-2 scrollbar-hide"
      >
        {/* Add story button */}
        {onAddClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddClick}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-pink-500 md:h-20 md:w-20">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-background md:h-[76px] md:w-[76px]">
                <Plus className="h-6 w-6 text-primary" />
              </div>
            </div>
            <span className="text-xs font-medium">Add Story</span>
          </motion.button>
        )}

        {/* Story items */}
        {stories.map((story, index) => (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStoryClick?.(story)}
            className="flex flex-col items-center gap-2"
          >
            <div
              className={cn(
                'relative h-16 w-16 rounded-full p-[3px] md:h-20 md:w-20',
                story.viewed
                  ? 'bg-muted'
                  : 'bg-gradient-to-br from-primary via-purple-500 to-pink-500'
              )}
            >
              <div className="h-full w-full overflow-hidden rounded-full bg-background p-[2px]">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    unoptimized={true}
                    priority={true}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            <span className="max-w-16 truncate text-xs font-medium md:max-w-20">
              {story.title}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Right scroll button */}
      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-lg backdrop-blur md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// Full screen story viewer
interface StoryViewerProps {
  stories: Story[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export function StoryViewer({
  stories,
  initialIndex = 0,
  isOpen,
  onClose,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)

  const currentStory = stories[currentIndex]

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && currentStory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          {/* Progress bars */}
          <div className="absolute left-4 right-4 top-4 z-10 flex gap-1">
            {stories.map((_, index) => (
              <div
                key={index}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      index < currentIndex
                        ? '100%'
                        : index === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-12 z-10 rounded-full p-2 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation areas */}
          <button
            onClick={goPrev}
            className="absolute left-0 top-0 z-10 h-full w-1/3"
          />
          <button
            onClick={goNext}
            className="absolute right-0 top-0 z-10 h-full w-2/3"
          />

          {/* Story content */}
          <motion.div
            key={currentStory.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative h-full w-full"
          >
            <Image
              src={currentStory.image}
              alt={currentStory.title}
              fill
              unoptimized={true}
              priority={true}
              className="object-contain"
            />
          </motion.div>

          {/* Story info */}
          <div className="absolute left-4 top-12 z-10 flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <Image
                src={currentStory.image}
                alt=""
                width={40}
                height={40}
                unoptimized={true}
                priority={true}
                className="object-cover"
              />
            </div>
            <span className="font-medium text-white">{currentStory.title}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
