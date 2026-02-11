'use client'

import { useState, useCallback, Suspense, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import Lenis from 'lenis'
import { usePublicMediaFeed, usePublicVendors } from '@/hooks/queries/use-public-vendors'
import { MasonryGrid } from '@/components/features/vendors/masonry-grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  ImageIcon,
  Camera,
  Sparkles,
  Flower2,
  UtensilsCrossed,
  Building2,
  Music,
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

// ─── Quick Categories ────────────────────────────────────────────────────────

const quickCategories = [
  { title: 'Venues', icon: Building2, slug: 'venues', bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-600 dark:text-rose-400' },
  { title: 'Photography', icon: Camera, slug: 'photography', bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  { title: 'Decor', icon: Sparkles, slug: 'decor', bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-600 dark:text-violet-400' },
  { title: 'Florists', icon: Flower2, slug: 'florists', bg: 'bg-pink-50 dark:bg-pink-950/30', iconColor: 'text-pink-600 dark:text-pink-400' },
  { title: 'Catering', icon: UtensilsCrossed, slug: 'catering', bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { title: 'Entertainment', icon: Music, slug: 'dj-music', bg: 'bg-sky-50 dark:bg-sky-950/30', iconColor: 'text-sky-600 dark:text-sky-400' },
]

// ─── Inspiration Grid ────────────────────────────────────────────────────────

function InspirationGrid({
  query,
  categoryId,
}: {
  query?: string
  categoryId?: string
}) {
  const [page, setPage] = useState(1)
  const [allMedia, setAllMedia] = useState<any[]>([])
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const filters = useMemo(
    () => ({
      query,
      categoryId,
      page,
      limit: 30,
    }),
    [query, categoryId, page],
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
  const categoryParam = searchParams.get('category') ?? ''
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)

  useSmoothScroll()

  const { data: vendorsData } = usePublicVendors({ limit: 100 })

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    if (vendorsData?.data) {
      vendorsData.data.forEach(vendor => {
        if (vendor.category?.slug && vendor.category?.id) {
          map.set(vendor.category.slug, vendor.category.id)
        }
      })
    }
    return map
  }, [vendorsData])

  const categoryId = selectedCategory ? (categoryMap.get(selectedCategory) || undefined) : undefined

  useEffect(() => {
    setSearchQuery(queryParam)
    setSelectedCategory(categoryParam)
  }, [queryParam, categoryParam])

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    router.push(`/discover?${params.toString()}`)
  }, [searchQuery, selectedCategory, router])

  const handleCategoryClick = useCallback((slug: string) => {
    setSelectedCategory(slug)
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    params.set('category', slug)
    router.push(`/discover?${params.toString()}`)
  }, [searchQuery, router])

  return (
    <main className="min-h-screen bg-background">
      {/* Compact Header */}
      <section className="border-b bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="text-center mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Discover
            </p>
            <h1 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
              Get inspired
            </h1>
          </FadeIn>

          {/* Search Bar */}
          <FadeIn delay={0.1} className="max-w-2xl mx-auto">
            <div className="relative flex items-center bg-background border border-border rounded-full shadow-sm p-1.5 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
              <Search className="h-5 w-5 text-muted-foreground ml-4 shrink-0" />
              <Input
                type="text"
                placeholder="Search for ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-11 text-base px-4"
              />
              <Button onClick={handleSearch} className="rounded-full px-6 shrink-0">
                Explore
              </Button>
            </div>
          </FadeIn>

          {/* Quick Category Pills */}
          <FadeIn delay={0.15} className="mt-8">
            <div className="flex flex-wrap justify-center gap-2">
              {quickCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                    selectedCategory === cat.slug
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : `${cat.bg} ${cat.iconColor} hover:shadow-sm`
                  }`}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.title}
                </button>
              ))}
              {selectedCategory && (
                <button
                  onClick={() => {
                    setSelectedCategory('')
                    router.push('/discover')
                  }}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <InspirationGrid
          key={`${queryParam}-${categoryId}`}
          query={queryParam}
          categoryId={categoryId}
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
