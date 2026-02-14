'use client'

import { useState, useCallback, Suspense, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import Lenis from 'lenis'
import { usePublicMediaFeed } from '@/hooks/queries/use-public-vendors'
import { MasonryGrid } from '@/components/features/vendors/masonry-grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  ImageIcon,
} from 'lucide-react'

// ─── Lenis Smooth Scroll ─────────────────────────────────────────────────────

function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
}

// ─── Reusable Motion Wrappers ────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const

function FadeIn({
  children,
  delay = 0,
  className = '',
  y = 40,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Inspiration Grid ────────────────────────────────────────────────────────

function InspirationGrid({
  query,
}: {
  query?: string
}) {
  const [page, setPage] = useState(1)
  const [allMedia, setAllMedia] = useState<any[]>([])
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const filters = useMemo(
    () => ({
      query,
      page,
      limit: 30,
    }),
    [query, page],
  )

  const { data: mediaData, isLoading: mediaLoading, isFetching } = usePublicMediaFeed(filters)

  useEffect(() => {
    if (mediaData?.data) {
      if (page === 1) {
        setAllMedia(mediaData.data)
      } else {
        // Deduplicate by ID to prevent duplicate keys
        setAllMedia(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = mediaData.data.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [mediaData, page])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !mediaLoading && !isFetching) {
          const hasMore = mediaData?.meta?.hasNextPage ?? (allMedia.length < (mediaData?.meta?.total || 0))
          if (hasMore) {
            setPage(prev => prev + 1)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [mediaLoading, isFetching, mediaData?.meta, allMedia.length])

  if (mediaLoading && page === 1) {
    const heights = [280, 320, 240, 360, 300, 260, 340, 280, 320, 380, 260, 300]
    return (
      <div className="columns-1 min-[480px]:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 lg:gap-5">
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

  if (allMedia.length === 0) {
    return (
      <FadeIn className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <ImageIcon className="h-9 w-9 text-muted-foreground/60" />
        </div>
        <h3 className="font-serif text-xl font-semibold mb-2">No inspiration found</h3>
        <p className="text-muted-foreground max-w-md">
          Try searching for something else or browse another category.
        </p>
      </FadeIn>
    )
  }

  return (
    <>
      <MasonryGrid items={allMedia} />

      {(allMedia.length < (mediaData?.meta?.total || 0) || isFetching) && (
        <div ref={loadMoreRef} className="py-12 flex justify-center w-full">
          {isFetching && (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── Page Content ────────────────────────────────────────────────────────────

function DiscoverPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('query') ?? ''
  const [searchQuery, setSearchQuery] = useState(queryParam)

  useSmoothScroll()

  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  const handleSearch = useCallback(() => {
    const normalizedQuery = searchQuery.trim()
    const params = new URLSearchParams()
    if (normalizedQuery) params.set('query', normalizedQuery)
    router.push(params.toString() ? `/discover?${params.toString()}` : '/discover')
  }, [searchQuery, router])

  return (
    <main className="min-h-screen bg-background">
      {/* Compact Header */}
      <section className="border-b bg-muted/20 py-6 lg:py-8">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mb-4 text-left">
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">
              Get inspired
            </h1>
          </FadeIn>

          {/* Search Bar */}
          <FadeIn delay={0.05} className="max-w-xl">
            <div className="relative flex items-center bg-background border border-border rounded-full shadow-sm p-1.5 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
              <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search inspiration, styles, themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-9 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
              />
              <Button onClick={handleSearch} className="h-9 shrink-0 rounded-full px-4 text-sm">
                Explore
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <InspirationGrid
          key={queryParam}
          query={queryParam}
        />
      </div>
    </main>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading inspiration...</span>
        </div>
      </div>
    }>
      <DiscoverPageContent />
    </Suspense>
  )
}
