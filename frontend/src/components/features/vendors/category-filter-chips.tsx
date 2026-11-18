'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SketchButton } from '@/components/sketch'

// Common wedding vendor categories
export const VENDOR_CATEGORIES = [
  { id: 'all', name: 'All', icon: null },
  { id: 'photography', name: 'Photography', icon: null },
  { id: 'videography', name: 'Videography', icon: null },
  { id: 'venues', name: 'Venues', icon: null },
  { id: 'catering', name: 'Catering', icon: null },
  { id: 'florists', name: 'Florists', icon: null },
  { id: 'wedding-planning', name: 'Planning', icon: null },
  { id: 'dj-music', name: 'DJ & Music', icon: null },
  { id: 'makeup-hair', name: 'Beauty', icon: null },
  { id: 'decor', name: 'Decor', icon: null },
  { id: 'cakes', name: 'Cakes', icon: null },
  { id: 'invitations', name: 'Invitations', icon: null },
  { id: 'rentals', name: 'Rentals', icon: null },
] as const

export type CategoryId = (typeof VENDOR_CATEGORIES)[number]['id']

interface CategoryFilterChipsProps {
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  className?: string
}

export function CategoryFilterChips({
  selectedCategory,
  onCategoryChange,
  className,
}: CategoryFilterChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScrollPosition()
    window.addEventListener('resize', checkScrollPosition)
    return () => window.removeEventListener('resize', checkScrollPosition)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 200
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll button */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-paper via-paper to-transparent pr-4">
          <SketchButton
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-4 w-4" />
          </SketchButton>
        </div>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {VENDOR_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id ||
            (category.id === 'all' && !selectedCategory)

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id === 'all' ? '' : category.id)}
              className={cn(
                'sk-chip flex-shrink-0 cursor-pointer !px-4 !py-2 !text-sm transition-colors',
                isSelected
                  ? 'bg-blue text-on-blue'
                  : 'hover:bg-blue-wash'
              )}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      {/* Right scroll button */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-l from-paper via-paper to-transparent pl-4">
          <SketchButton
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-4 w-4" />
          </SketchButton>
        </div>
      )}
    </div>
  )
}
