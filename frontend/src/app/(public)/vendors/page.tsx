'use client'

import { useState, useCallback, Suspense, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  motion,
  useInView,
  type Variants,
  AnimatePresence,
} from 'framer-motion'
import Lenis from 'lenis'
import { usePublicVendors, useFeaturedVendors } from '@/hooks/queries/use-public-vendors'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Users,
  ArrowRight,
  Building2,
  Camera,
  Music,
  Flower2,
  UtensilsCrossed,
  Sparkles,
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

// Animated card wrapper - animates each item independently
function AnimatedCard({
  children,
  index
}: {
  children: React.ReactNode
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.05, 0.3), // Cap delay at 0.3s
        ease
      }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      {children}
    </motion.div>
  )
}

// ─── Quick Categories ────────────────────────────────────────────────────────

const quickCategories = [
  { title: 'Venues', icon: Building2, slug: 'venues', bg: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-600 dark:text-rose-400' },
  { title: 'Photographers', icon: Camera, slug: 'photography', bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  { title: 'Caterers', icon: UtensilsCrossed, slug: 'catering', bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { title: 'Decorators', icon: Sparkles, slug: 'decor', bg: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-600 dark:text-violet-400' },
  { title: 'Florists', icon: Flower2, slug: 'florists', bg: 'bg-pink-50 dark:bg-pink-950/30', iconColor: 'text-pink-600 dark:text-pink-400' },
  { title: 'Entertainment', icon: Music, slug: 'dj-music', bg: 'bg-sky-50 dark:bg-sky-950/30', iconColor: 'text-sky-600 dark:text-sky-400' },
]

// ─── Vendor Results Grid ─────────────────────────────────────────────────────

function VendorResults({
  query,
  categoryId,
  onTotalChange
}: {
  query?: string
  categoryId?: string
  onTotalChange: (total: number) => void
}) {
  const [page, setPage] = useState(1)
  const [allVendors, setAllVendors] = useState<any[]>([])
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const filters = useMemo(
    () => ({
      query,
      categoryId,
      page,
      limit: 24,
    }),
    [query, categoryId, page],
  )

  const { data: vendorsData, isLoading: vendorsLoading, isFetching } = usePublicVendors(filters)
  const totalVendors = vendorsData?.meta?.total || 0

  useEffect(() => {
    if (vendorsData?.meta?.total !== undefined) {
      onTotalChange(vendorsData.meta.total)
    }
  }, [vendorsData?.meta?.total, onTotalChange])

  useEffect(() => {
    if (vendorsData?.data) {
      if (page === 1) {
        setAllVendors(vendorsData.data)
      } else {
        // Deduplicate by ID to prevent duplicate keys
        setAllVendors(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = vendorsData.data.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [vendorsData, page])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !vendorsLoading && !isFetching) {
          const hasMore = vendorsData?.meta?.hasNextPage ?? (allVendors.length < (vendorsData?.meta?.total || 0))
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
  }, [vendorsLoading, isFetching, vendorsData?.meta, allVendors.length])

  const displayVendors = allVendors.length ? allVendors : (vendorsData?.data || [])

  if (vendorsLoading && page === 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Skeleton className="aspect-[4/5] rounded-2xl" />
          </motion.div>
        ))}
      </div>
    )
  }

  if (displayVendors.length === 0) {
    return (
      <FadeIn className="py-20 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Users className="h-9 w-9 text-muted-foreground/60" />
        </div>
        <h3 className="font-serif text-xl font-semibold mb-2">No vendors found</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Try adjusting your search or browse a different category.
        </p>
      </FadeIn>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayVendors.map((vendor, index) => (
          <AnimatedCard key={vendor.id} index={index % 24}>
            <VendorCard vendor={vendor} />
          </AnimatedCard>
        ))}
      </div>

      {(displayVendors.length < totalVendors || isFetching) && (
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

function VendorsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('query') ?? ''
  const categoryParam = searchParams.get('category') ?? ''
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [totalVendors, setTotalVendors] = useState(0)

  useSmoothScroll()

  const { data: allVendorsData } = usePublicVendors({ limit: 100 })
  const { data: featuredVendors, isLoading: featuredLoading } = useFeaturedVendors(8)

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    if (allVendorsData?.data) {
      allVendorsData.data.forEach(vendor => {
        if (vendor.category?.slug && vendor.category?.id) {
          map.set(vendor.category.slug, vendor.category.id)
        }
      })
    }
    return map
  }, [allVendorsData])

  const categoryId = selectedCategory ? (categoryMap.get(selectedCategory) || undefined) : undefined

  useEffect(() => {
    setSearchQuery(queryParam)
    setSelectedCategory(categoryParam)
  }, [queryParam, categoryParam])

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    router.push(`/vendors?${params.toString()}`)
  }, [searchQuery, selectedCategory, router])

  const handleCategoryClick = useCallback((slug: string) => {
    setSelectedCategory(slug)
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    params.set('category', slug)
    router.push(`/vendors?${params.toString()}`)
  }, [searchQuery, router])

  const showFeatured = !queryParam && !categoryId && featuredVendors && featuredVendors.length > 0

  return (
    <main className="min-h-screen bg-background">
      {/* Compact Search Header */}
      <section className="border-b bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="text-center mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Vendors
            </p>
            <h1 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
              Find your perfect team
            </h1>
          </FadeIn>

          {/* Search Bar */}
          <FadeIn delay={0.1} className="max-w-2xl mx-auto">
            <div className="relative flex items-center bg-background border border-border rounded-full shadow-sm p-1.5 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
              <Search className="h-5 w-5 text-muted-foreground ml-4 shrink-0" />
              <Input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-11 text-base px-4"
              />
              <Button onClick={handleSearch} className="rounded-full px-6 shrink-0">
                Search
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
                    router.push('/vendors')
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

        {/* Featured Section */}
        {showFeatured && (
          <section className="mb-16">
            <FadeIn className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-1">Featured</p>
                <h2 className="font-serif text-2xl font-bold sm:text-3xl">Top-rated professionals</h2>
              </div>
              <Button variant="ghost" className="hidden sm:flex group" asChild>
                <Link href="/vendors?featured=true">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </FadeIn>

            {featuredLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredVendors!.slice(0, 4).map((vendor, index) => (
                  <AnimatedCard key={vendor.id} index={index}>
                    <VendorCard vendor={vendor} />
                  </AnimatedCard>
                ))}
              </div>
            )}
          </section>
        )}

        {/* All Vendors */}
        <section>
          <FadeIn className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold sm:text-3xl">
                  {queryParam || categoryId ? 'Search Results' : 'All Vendors'}
                </h2>
                {totalVendors > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalVendors} professionals found
                  </p>
                )}
              </div>
            </div>
          </FadeIn>

          <VendorResults
            key={`${queryParam}-${categoryId}`}
            query={queryParam}
            categoryId={categoryId}
            onTotalChange={setTotalVendors}
          />
        </section>
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 py-16 lg:py-20 overflow-hidden relative">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-rose-500/10 blur-[100px]" />

        <FadeIn className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Are you a vendor?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Join thousands of professionals on Omnicassion and grow your business.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg">
              <Link href="/business">
                Join as Professional
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/20 bg-white/5 px-8 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/business/about">Learn More</Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </main>
  )
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading vendors...</span>
        </div>
      </div>
    }>
      <VendorsPageContent />
    </Suspense>
  )
}
