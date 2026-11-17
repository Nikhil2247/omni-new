'use client'

import { useState, useCallback, Suspense, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import Lenis from 'lenis'
import { usePublicMediaFeed } from '@/hooks/queries/use-public-vendors'
import { useBoostedVendors } from '@/hooks/queries/use-ads'
import { trackDashboard } from '@/lib/analytics/umami'
import { MasonryGrid } from '@/components/features/vendors/masonry-grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { Brush, Eyebrow, Ico, ICONS, Paper } from '@/components/sketch'

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
  boostedVendorIds,
}: {
  query?: string
  boostedVendorIds?: Set<string>
}) {
  const [page, setPage] = useState(1)
  const [allMedia, setAllMedia] = useState<any[]>([])
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Reset pagination when query changes
  useEffect(() => {
    setPage(1)
    setAllMedia([])
    setHasReachedEnd(false)
  }, [query])

  const filters = useMemo(
    () => ({
      query,
      page,
      limit: 30,
      orderBy: 'random' as const,
    }),
    [query, page],
  )

  const { data: mediaData, isLoading: mediaLoading, isFetching } = usePublicMediaFeed(filters)

  const mediaItems = useMemo(() => mediaData?.data ?? [], [mediaData])
  const hasNextPage = mediaData?.meta?.hasNextPage === true

  useEffect(() => {
    if (mediaItems.length > 0 || page === 1) {
      if (page === 1) {
        setAllMedia(mediaItems)
        setHasReachedEnd(mediaItems.length === 0 || !hasNextPage)
      } else {
        // Deduplicate by ID to prevent duplicate keys
        setAllMedia(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = mediaItems.filter(item => !existingIds.has(item.id))
          // If no new unique items and API says no more pages, we've reached the end
          if (newItems.length === 0 || !hasNextPage) {
            setHasReachedEnd(true)
          }
          return [...prev, ...newItems]
        })
      }
    }
  }, [mediaItems, hasNextPage, page])

  useEffect(() => {
    if (hasReachedEnd) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !mediaLoading && !isFetching && !hasReachedEnd) {
          const hasMore = hasNextPage
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
  }, [mediaLoading, isFetching, hasNextPage, hasReachedEnd])

  if (mediaLoading && page === 1) {
    const heights = [280, 320, 240, 360, 300, 260, 340, 280, 320, 380, 260, 300]
    return (
      <div className="columns-1 min-[480px]:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-1.5 sm:gap-2">
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

  if (allMedia.length === 0) {
    return (
      <FadeIn className="py-16">
        <Paper className="mx-auto max-w-md px-6 py-10 text-center">
          <Ico d={ICONS.gallery} className="mx-auto mb-2 !size-[70px]" />
          <h3 className="font-display mb-2 text-2xl font-semibold">No inspiration found</h3>
          <p className="text-ink-soft mx-auto max-w-md">
            Try searching for something else or browse another category.
          </p>
        </Paper>
      </FadeIn>
    )
  }

  return (
    <>
      <MasonryGrid items={allMedia} boostedVendorIds={boostedVendorIds} />

      {!hasReachedEnd && (
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

function InspirePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('query') ?? ''
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const { data: boostedVendors = [] } = useBoostedVendors()

  const boostedVendorIds = useMemo(
    () => new Set(boostedVendors.map((entry) => entry.vendorProfileId)),
    [boostedVendors],
  )

  useSmoothScroll()

  useEffect(() => {
    trackDashboard.sectionView('inspire', 'user')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <main className="min-h-screen">
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-1 md:pt-7">
        <FadeIn delay={0.05}>
          <Eyebrow>Discover</Eyebrow>
          <h1 className="font-display mt-2.5 max-w-[22ch] text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.05] font-semibold tracking-tight text-balance">
            Inspiration, <Brush>pinned</Brush> by the people who made it.
          </h1>
          <div className="sk-pill mt-[22px]">
            <input
              type="text"
              placeholder="Search inspiration, styles, themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              aria-label="Search inspiration"
            />
            <button type="button" onClick={handleSearch} aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="text-ink-soft mt-3.5 flex flex-wrap items-center gap-2 text-[0.9rem]">
            Try:
            {['marigold', 'mandap', 'candid', 'lanterns', 'bridal', 'mehendi'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => router.push(`/discover?query=${encodeURIComponent(t)}`)}
                className="text-blue decoration-blue-wash px-1 py-0.5 font-bold underline decoration-[3px] underline-offset-[3px]"
              >
                {t}
              </button>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 lg:py-8">
        <InspirationGrid
          key={queryParam}
          query={queryParam}
          boostedVendorIds={boostedVendorIds}
        />
      </div>
    </main>
  )
}

export default function InspirePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading inspiration...</span>
        </div>
      </div>
    }>
      <InspirePageContent />
    </Suspense>
  )
}
