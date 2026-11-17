'use client'

import { PaintedScene, SketchButton, Vine } from '@/components/sketch'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { usePublicVendor, usePublicVendors } from '@/hooks/queries/use-public-vendors'
import { useAuthStore } from '@/store/auth-store'
import { WishlistPickerDialog } from '@/components/common/wishlist-picker-dialog'
import { GetQuoteDialog } from '@/components/features/vendors/get-quote-dialog'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import {
  useAddWishlistItem,
  useCreateWishlist,
  useWishlistMine,
  wishlistKeys,
} from '@/hooks/queries/use-wishlists'
import { useCreateUserVendorConversation } from '@/hooks/queries/use-messaging'
import { useToggleVendorFollow, useVendorFollowStatus } from '@/hooks/queries/use-vendor-follows'
import { useCreateVendorReview, useVendorReviews } from '@/hooks/queries/use-vendor-reviews'
import { useMediaItemTags } from '@/hooks/queries/use-media-tags'
import { useClaimStatus } from '@/hooks/queries/use-vendor-claim'
import { ClaimVendorButton } from '@/components/vendors/claim-vendor-button'
import { ClaimStatusBanner } from '@/components/vendors/claim-status-banner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  MapPin,
  Star,
  Calendar,
  MessageSquare,
  UserPlus,
  UserCheck,
  ExternalLink,
  Award,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  CalendarDays,
  Camera,
  Sparkles,
  IndianRupee,
  Clock,
  PenLine,
  Zap,
  Eye,
  Briefcase,
  FileText,
  Images,
  UtensilsCrossed,
  // Badge icons
  Users,
  Heart,
  TrendingUp,
  Flame,
  Medal,
  Trophy,
  Gem,
  Crown,
  Rocket,
  Shield,
  Diamond,
  MessageCircle,
  ThumbsUp,
  Mail,
  Inbox,
  Bell,
  Target,
  Search,
  type LucideIcon,
} from 'lucide-react'
import type { VendorProfile as VendorProfileType } from '@/lib/api/types/business.types'
import type { VendorProfile } from '@/lib/api/types/vendor.types'
import { cn } from '@/lib/utils'
import { trackVendor, trackMessages } from '@/lib/analytics/umami'
import { usePageEngagement } from '@/hooks/use-umami'

function MediaTagChips({ mediaItemId }: { mediaItemId: string }) {
  const { data: tags = [] } = useMediaItemTags(mediaItemId)
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <span key={tag.id} className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
          #{tag.tag}
        </span>
      ))}
    </div>
  )
}

const formatFollowers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const formatPrice = (price?: number | null, currency: string = 'INR') => {
  if (price === undefined || price === null) return null

  const normalizedCurrency = (currency || 'INR').toUpperCase()

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: normalizedCurrency,
    maximumFractionDigits: 0,
  }).format(price)
}

const getPricingTypeLabel = (pricingType?: string) => {
  switch (pricingType) {
    case 'FIXED':
      return 'Fixed Price'
    case 'RANGE':
      return 'Price Range'
    case 'STARTING_AT':
      return 'Starting At'
    case 'TIERED':
      return 'Package Tiers'
    case 'CONTACT_FOR_QUOTE':
      return 'Contact For Quote'
    default:
      return null
  }
}

const formatDuration = (durationMinutes?: number | null) => {
  if (!durationMinutes || durationMinutes <= 0) return null

  if (durationMinutes % (30 * 24 * 60) === 0) {
    const months = durationMinutes / (30 * 24 * 60)
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }

  if (durationMinutes % (24 * 60) === 0) {
    const days = durationMinutes / (24 * 60)
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }

  if (durationMinutes % 60 === 0) {
    const hours = durationMinutes / 60
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }

  return `${durationMinutes} min`
}

const formatEventDate = (date?: string | null) => {
  if (!date) return 'Date TBA'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatEventVendorStatus = (status?: string) => {
  switch (status) {
    case 'SHORTLISTED':
      return 'Shortlisted'
    case 'CONTACTED':
      return 'Contacted'
    case 'BOOKED':
      return 'Booked'
    case 'CONFIRMED':
      return 'Confirmed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return 'In Progress'
  }
}

function hasVendorMessagingEntitlement(vendor: unknown): boolean {
  if (!vendor || typeof vendor !== 'object') return false

  const candidate = vendor as Record<string, any>

  // Check planTier directly on vendor profile (most reliable)
  // VendorProfile.planTier is denormalized from subscription
  const planTier = String(candidate.planTier ?? '').toUpperCase()
  if (planTier === 'PROFESSIONAL' || planTier === 'ENTERPRISE') {
    return true
  }

  // Check subscription tier if available
  const subscriptionTier = String(
    candidate.subscription?.plan?.tier ??
    candidate.activeSubscription?.plan?.tier ??
    candidate.subscription?.tier ??
    ''
  ).toUpperCase()
  if (subscriptionTier === 'PROFESSIONAL' || subscriptionTier === 'ENTERPRISE') {
    return true
  }

  // Check feature arrays for explicit messaging feature
  const featureContainers = [
    candidate.features,
    candidate.planFeatures,
    candidate.subscriptionFeatures,
    candidate.subscription?.features,
    candidate.subscription?.plan?.features,
    candidate.activeSubscription?.features,
    candidate.activeSubscription?.plan?.features,
    candidate.plan?.features,
  ]

  const normalizedFeatureKeys = featureContainers
    .flatMap((container) => (Array.isArray(container) ? container : []))
    .map((feature: any) => {
      if (typeof feature === 'string') return feature.toLowerCase()
      if (feature && typeof feature === 'object') {
        // Check if messaging feature is enabled (limitValue > 0)
        const key = String(feature.key ?? feature.featureKey ?? feature.code ?? feature.name ?? '').toLowerCase()
        if (['messaging', 'messages', 'direct_message'].includes(key)) {
          // If limitValue exists, check if it's > 0
          if (feature.limitValue !== undefined) {
            return feature.limitValue > 0 ? key : ''
          }
          return key
        }
        return key
      }
      return ''
    })
    .filter(Boolean)

  return normalizedFeatureKeys.some((key) =>
    ['messaging', 'messages', 'direct_message', 'direct_messages', 'chat', 'inbox'].includes(key),
  )
}

// Badge icon mapping
const badgeIconMap: Record<string, LucideIcon> = {
  'user-plus': UserPlus,
  'users': Users,
  'heart': Heart,
  'trending-up': TrendingUp,
  'award': Award,
  'star': Star,
  'sparkles': Sparkles,
  'flame': Flame,
  'medal': Medal,
  'trophy': Trophy,
  'gem': Gem,
  'crown': Crown,
  'zap': Zap,
  'rocket': Rocket,
  'shield': Shield,
  'diamond': Diamond,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  'thumbs-up': ThumbsUp,
  'mail': Mail,
  'inbox': Inbox,
  'bell': Bell,
  'target': Target,
  'eye': Eye,
  'search': Search,
}

// Badge color mapping (bg and text classes)
const badgeColorMap: Record<string, { bg: string; text: string; ring: string }> = {
  slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-200 dark:ring-slate-700' },
  zinc: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-300', ring: 'ring-zinc-200 dark:ring-zinc-700' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-200 dark:ring-teal-800' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-200 dark:ring-cyan-800' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-200 dark:ring-sky-800' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-800' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-200 dark:ring-violet-800' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800' },
  fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40', text: 'text-fuchsia-600 dark:text-fuchsia-400', ring: 'ring-fuchsia-200 dark:ring-fuchsia-800' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-600 dark:text-pink-400', ring: 'ring-pink-200 dark:ring-pink-800' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-200 dark:ring-rose-800' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-200 dark:ring-yellow-800' },
}

const getEventStatusTone = (status?: string) => {
  switch (status) {
    case 'BOOKED':
      return {
        dot: 'bg-emerald-500',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        card: 'border-emerald-100/70 dark:border-emerald-900/40',
      }
    case 'CONFIRMED':
      return {
        dot: 'bg-sky-500',
        badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
        card: 'border-sky-100/70 dark:border-sky-900/40',
      }
    case 'CONTACTED':
      return {
        dot: 'bg-violet-500',
        badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
        card: 'border-violet-100/70 dark:border-violet-900/40',
      }
    case 'CANCELLED':
      return {
        dot: 'bg-rose-500',
        badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
        card: 'border-rose-100/70 dark:border-rose-900/40',
      }
    default:
      return {
        dot: 'bg-amber-500',
        badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        card: 'border-amber-100/70 dark:border-amber-900/40',
      }
  }
}

type VendorPageClientProps = {
  slug: string
  initialVendor?: VendorProfile | null
  showReviews?: boolean
  showSimilarVendors?: boolean
}

export default function VendorPageClient({
  slug,
  initialVendor,
  showReviews = true,
  showSimilarVendors = true,
}: VendorPageClientProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const userId = user?.id
  const queryClient = useQueryClient()

  const { data: vendor, isLoading, error } = usePublicVendor(slug, {
    enabled: !initialVendor,
    initialData: initialVendor ?? undefined,
  })

  // Fetch similar vendors from the same category
  const categoryId = vendor?.categoryId
  const { data: similarVendorsData } = usePublicVendors(
    { categoryId: categoryId || undefined, limit: 4 },
    { enabled: showSimilarVendors && !!categoryId },
  )

  // Filter out the current vendor from similar vendors
  const similarVendors = (similarVendorsData?.data || []).filter(v => v.id !== vendor?.id).slice(0, 4)

  const wishlistsQuery = useWishlistMine(Boolean(userId))
  const wishlists = (Array.isArray(wishlistsQuery.data) ? wishlistsQuery.data : []) as import('@/lib/api/types/wishlist.types').Wishlist[]
  const createWishlist = useCreateWishlist(userId ?? '')
  const addItem = useAddWishlistItem()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [locallySaved, setLocallySaved] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'events' | 'services' | 'badges'>('portfolio')
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [galleryPanelOpen, setGalleryPanelOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<typeof portfolios[0] | null>(null)

  const { mutateAsync: createConversation, isPending: isCreatingConversation } =
    useCreateUserVendorConversation()

  // Track page engagement (scroll depth + time on page)
  usePageEngagement(`vendor:${slug}`)

  // Track vendor view when data loads
  useEffect(() => {
    if (vendor?.id) {
      trackVendor.view(vendor.id, vendor.businessName, vendor.category?.name)
    }
  }, [vendor?.id])

  const isSaved =
    locallySaved ||
    (Array.isArray(wishlists) && wishlists.some((list) =>
      list.items?.some((item: { vendorProfileId?: string | null }) => item.vendorProfileId === vendor?.id)
    ))

  const handleSave = () => {
    if (!userId) {
      router.push('/login')
      return
    }
    if (isSaved || isSaving) return
    if (vendor?.id) trackVendor.shortlist(vendor.id)
    setDialogOpen(true)
  }

  const handleConfirm = async ({
    wishlistId,
    wishlistName,
  }: {
    wishlistId?: string
    wishlistName?: string
  }) => {
    if (!vendor || !userId) return

    let targetId = wishlistId

    if (!targetId && wishlistName) {
      const created = await createWishlist.mutateAsync({ name: wishlistName })
      targetId = created.id
    }

    if (!targetId) return

    try {
      setIsSaving(true)
      await addItem.mutateAsync({
        wishlistId: targetId,
        input: { vendorProfileId: vendor.id },
      })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.byId(targetId) })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.mine() })
      setLocallySaved(true)
      toast.success('Saved to wishlist')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMessageVendor = async () => {
    if (!vendor?.id) return
    if (!vendorHasMessaging) {
      toast.info('Messaging is not available for this vendor plan.')
      return
    }
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    trackMessages.conversationStart('vendor')
    const conversation = await createConversation(vendor.id)
    router.push(`/messages?conversationId=${conversation.id}`)
  }

  const followStatus = useVendorFollowStatus(vendor?.id || '', Boolean(userId))
  const toggleFollow = useToggleVendorFollow()
  const { data: vendorReviews = [] } = useVendorReviews(showReviews ? (vendor?.id || '') : '')

  // Claim status query - only fetch if user is authenticated and vendor exists
  const { data: claimStatus } = useClaimStatus(vendor?.id || '', {
    enabled: isAuthenticated && !!vendor?.id
  })

  // Determine if vendor is claimable (PUBLIC/UNCLAIMED)
  const isVendorUnclaimed = vendor?.status === 'UNCLAIMED'
  const isOwnVendor = vendor?.userId === user?.id
  const canShowClaimUI = isVendorUnclaimed && !isOwnVendor
  // Show claim button for authenticated users who can claim, OR for non-authenticated users (will redirect to login)
  const canShowClaimButton = canShowClaimUI && (
    !isAuthenticated || // Non-authenticated users see button (redirects to login)
    claimStatus?.canClaim === true ||
    !claimStatus?.hasClaim
  )

  const createReview = useCreateVendorReview()

  const handleFollow = async () => {
    if (!vendor?.id) return
    if (!userId) {
      router.push('/login')
      return
    }
    await toggleFollow.mutateAsync(vendor.id)
  }

  const handleSubmitReview = async () => {
    if (!vendor?.id) return
    if (!userId) {
      router.push('/login')
      return
    }

    await createReview.mutateAsync({
      vendorProfileId: vendor.id,
      rating: reviewForm.rating,
      title: reviewForm.title || undefined,
      body: reviewForm.body || undefined,
    })

    trackVendor.reviewSubmit(vendor.id, reviewForm.rating)
    setReviewForm({ rating: 5, title: '', body: '' })
    setReviewModalOpen(false)
    toast.success('Review submitted successfully!')
  }

  if (isLoading) {
    return <VendorDetailSkeleton />
  }

  if (error || !vendor) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Vendor Not Found</h1>
            <p className="mt-3 max-w-md text-muted-foreground">
              The vendor you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button className="mt-8" size="lg" asChild>
              <Link href="/vendors">Browse All Vendors</Link>
            </Button>
          </motion.div>
        </div>
      </main>
    )
  }

  const isVerified = !!vendor?.verifiedAt
  const portfolios = (vendor as VendorProfileType).portfolios || []
  const services = (vendor as VendorProfileType).services || []
  const address = (vendor as any).address as any
  const category = (vendor as VendorProfileType).category

  // Messaging is available only when the vendor has the feature in their active plan.
  const vendorHasMessaging = hasVendorMessagingEntitlement(vendor)

  const featuredPortfolios = portfolios.filter((portfolio) => portfolio.isFeatured)
  const nonFeaturedPortfolios = portfolios.filter((portfolio) => !portfolio.isFeatured)
  const featuredMedia = featuredPortfolios.flatMap((portfolio) => portfolio.mediaItems || [])
  const nonFeaturedMedia = nonFeaturedPortfolios.flatMap((portfolio) => portfolio.mediaItems || [])

  // Get all media items from portfolios in featured-first order
  const allMedia = [...featuredMedia, ...nonFeaturedMedia]

  // Calculate member since year (guard against invalid dates yielding NaN)
  const _memberSinceRaw = vendor.createdAt ? new Date(vendor.createdAt).getFullYear() : null
  const memberSince = _memberSinceRaw && !Number.isNaN(_memberSinceRaw) ? _memberSinceRaw : null

  // Get events count (using portfolios count as proxy)
  const eventHistory = ((vendor as any).eventHistory || []) as Array<{
    id: string
    status?: string
    notes?: string | null
    event?: {
      id: string
      name: string
      date?: string | null
      venueName?: string | null
      guestCount?: number | null
      description?: string | null
      eventType?: {
        name?: string | null
      } | null
    }
  }>

  const eventsCount = eventHistory.length

  // Calculate average rating
  const avgRating = vendorReviews.length > 0
    ? (vendorReviews.reduce((acc, r) => acc + r.rating, 0) / vendorReviews.length).toFixed(1)
    : null

  // A stable number so a vendor without a banner always gets the same painted scene
  const bannerSeed = Math.abs(Array.from(String(vendor.id ?? '')).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 997

  const tabs = [
    { id: 'portfolio' as const, label: 'Portfolio', icon: Grid3X3 },
    { id: 'events' as const, label: 'Events', icon: CalendarDays },
    { id: 'services' as const, label: 'Services', icon: Sparkles },
    { id: 'badges' as const, label: 'Cert/Badges', icon: Award },
  ]

  return (
    <main className="min-h-screen">
      {/* Banner + Avatar Header — LinkedIn-style */}
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-2">
        {/* Banner */}
        <div className="border-ink bg-sky1 relative h-40 w-full overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2 md:h-60">
          {vendor.bannerImageUrl ? (
            <Image
              src={vendor.bannerImageUrl}
              alt={`${vendor.businessName} banner`}
              fill
              unoptimized={true}
              priority={true}
              className="object-cover"
            />
          ) : (
            <>
              <PaintedScene seed={bannerSeed} motif={bannerSeed % 5} className="absolute inset-0 h-full w-full" />
              <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={bannerSeed + 60} n={7} s={0.85} className="pointer-events-none absolute top-0 -right-2.5 h-[170px] w-60 -scale-x-100" />
              <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={bannerSeed + 70} n={6} s={0.75} className="pointer-events-none absolute -bottom-5 -left-2.5 h-[140px] w-[200px]" />
            </>
          )}
        </div>

        {/* Avatar + Actions row */}
        <div className="px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar — overlaps banner */}
            <div className="-mt-13 md:-mt-18 self-start sm:self-auto">
              <div className="relative">
                <div className="relative h-26 w-26 overflow-hidden border-paper bg-card ring-ink rounded-full border-4 ring-2 md:h-36 md:w-36">
                  {vendor.profilePhotoUrl ? (
                    <Image
                      src={vendor.profilePhotoUrl}
                      alt={vendor.businessName || ''}
                      fill
                      unoptimized={true}
                      priority={true}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gold font-display text-ink text-4xl font-bold">
                      {vendor.businessName?.charAt(0) || 'V'}
                    </div>
                  )}
                </div>
                {/* Verified Badge */}
                {isVerified && (
                  <div className="absolute -bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-md ring-2 ring-paper md:h-8 md:w-8">
                    <Star className="h-3.5 w-3.5 fill-primary-foreground text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 pb-3">
              {vendorHasMessaging && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SketchButton size="sm" onClick={handleMessageVendor} disabled={isCreatingConversation}>
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </SketchButton>
                  </TooltipTrigger>
                  <TooltipContent>Start chat with vendor</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <SketchButton variant="line" size="sm" onClick={() => setQuoteDialogOpen(true)}>
                    <FileText className="h-4 w-4" />
                    Get Quote
                  </SketchButton>
                </TooltipTrigger>
                <TooltipContent>Request pricing and availability</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <SketchButton variant="line" size="icon" onClick={handleFollow} aria-label={followStatus.data?.following ? 'Following' : 'Follow'}>
                    {followStatus.data?.following ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </SketchButton>
                </TooltipTrigger>
                <TooltipContent>{followStatus.data?.following ? 'Following vendor' : 'Follow vendor'}</TooltipContent>
              </Tooltip>

              {vendor.website && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SketchButton variant="line" size="icon" onClick={() => {
                        if (vendor.website) {
                          window.open(
                            vendor.website.startsWith('http')
                              ? vendor.website
                              : `https://${vendor.website}`,
                            '_blank'
                          )
                        }
                      }} aria-label="Website">
                      <ExternalLink className="h-4 w-4" />
                    </SketchButton>
                  </TooltipTrigger>
                  <TooltipContent>Open website</TooltipContent>
                </Tooltip>
              )}

              {canShowClaimButton && (
                <ClaimVendorButton
                  vendorProfileId={vendor.id}
                  vendorName={vendor.businessName}
                  contactEmail={vendor.contactEmail}
                  contactPhone={vendor.contactPhone}
                  className="h-9 gap-1.5 px-3"
                />
              )}
            </div>
          </div>

          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 pb-6"
          >
            {/* Name + Verified + Unclaimed */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-tight font-semibold">{vendor.businessName}</h1>
              {isVerified && (
                <span className="sk-stamp"><Star className="-mt-0.5 mr-0.5 inline h-3 w-3 fill-current" />Verified</span>
              )}
              {isVendorUnclaimed && (
                <span className="sk-stamp sk-stamp--wait"><Shield className="-mt-0.5 mr-0.5 inline h-3 w-3" />Public Listing</span>
              )}
            </div>

            {/* Category + Tagline */}
            {(category?.name || vendor.tagline) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {[category?.name, vendor.tagline].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Location + Since */}
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {address && (address.city || address.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[address.city, address.state].filter(Boolean).join(', ')}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Since {memberSince}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
              {(vendor.followersCount ?? 0) > 0 && (
                <span className="text-blue font-semibold">
                  {formatFollowers(vendor.followersCount ?? 0)}{' '}
                  <span className="font-normal text-muted-foreground">followers</span>
                </span>
              )}
              {eventsCount > 0 && (
                <span>
                  <span className="font-semibold text-foreground">{eventsCount}</span>
                  <span className="ml-1 text-muted-foreground">events</span>
                </span>
              )}
              {allMedia.length > 0 && (
                <span>
                  <span className="font-semibold text-foreground">{allMedia.length}</span>
                  <span className="ml-1 text-muted-foreground">photos</span>
                </span>
              )}
              {(vendor.viewCount ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{formatFollowers(vendor.viewCount ?? 0)}</span>
                  <span className="text-muted-foreground">views</span>
                </span>
              )}
              {(vendor.leadCount ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{vendor.leadCount}</span>
                  <span className="text-muted-foreground">inquiries</span>
                </span>
              )}
              {avgRating && (
                <span className="flex items-center gap-1">
                  <Star className="text-gold h-3.5 w-3.5 fill-current" />
                  <span className="font-semibold text-foreground">{avgRating}</span>
                  <span className="text-muted-foreground">({vendorReviews.length})</span>
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-[1440px] px-4">

        {/* Claim Status Banner - show if user has a claim on this vendor */}
        {isAuthenticated && canShowClaimUI && (
          <ClaimStatusBanner vendorProfileId={vendor.id} />
        )}

        <div className="border-line border-b-2 border-dashed">
          <div role="tablist" aria-label="Vendor sections" className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative inline-flex items-center gap-2 px-4 py-3 text-[0.95rem] font-bold transition-colors',
                    isActive
                      ? 'text-ink after:bg-blue after:absolute after:inset-x-2 after:-bottom-1 after:h-1.5 after:rounded-full after:[filter:url(#sk-dry)]'
                      : 'text-ink-soft hover:text-ink'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          <AnimatePresence mode="wait">
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(featuredPortfolios.length > 0 || allMedia.length > 0) ? (
                  <div className="space-y-8">
                    {/* Featured Albums - Carousel */}
                    {featuredPortfolios.length > 0 && (
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Featured Albums</h3>
                          {featuredPortfolios.length > 1 && (
                            <span className="text-xs text-muted-foreground sm:hidden">
                              Swipe to see more
                            </span>
                          )}
                        </div>
                        <Carousel
                          opts={{
                            align: 'start',
                            loop: featuredPortfolios.length > 2,
                          }}
                          className="w-full"
                        >
                          <CarouselContent className="-ml-2 md:-ml-4">
                            {featuredPortfolios.map((portfolio, idx) => {
                              const albumMedia = portfolio.mediaItems || []
                              if (albumMedia.length === 0) return null
                              const coverImage = albumMedia[0]

                              return (
                                <CarouselItem key={portfolio.id} className="pl-2 md:pl-4 basis-[65%] sm:basis-1/2 lg:basis-1/3">
                                  <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedAlbum(portfolio)}
                                    className="group border-ink bg-card relative w-full overflow-hidden rounded-md border-2 text-left transition-all hover:-translate-y-1"
                                  >
                                    {/* Album Cover Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                      <Image
                                        src={coverImage.cdnUrl || coverImage.url}
                                        alt={coverImage.altText || portfolio.title || 'Album'}
                                        fill
                                        unoptimized={true}
                                        loading={idx < 2 ? 'eager' : 'lazy'}
                                        sizes="(max-width: 640px) 65vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                      {/* Photo count overlay */}
                                      <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-white backdrop-blur-sm">
                                        <Images className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        {albumMedia.length}
                                      </div>
                                      {/* Hover overlay */}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                                          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Album Info */}
                                    <div className="p-2.5 sm:p-4">
                                      <h3 className="font-semibold text-foreground line-clamp-1 text-xs sm:text-base">
                                        {portfolio.title || 'Portfolio'}
                                      </h3>
                                      {portfolio.description && (
                                        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
                                          {portfolio.description}
                                        </p>
                                      )}
                                    </div>
                                  </motion.button>
                                </CarouselItem>
                              )
                            })}
                          </CarouselContent>
                          {featuredPortfolios.length > 1 && (
                            <div className="hidden sm:block">
                              <CarouselPrevious className="left-0 -translate-x-1/2 bg-background/80 backdrop-blur-sm hover:bg-background" />
                              <CarouselNext className="right-0 translate-x-1/2 bg-background/80 backdrop-blur-sm hover:bg-background" />
                            </div>
                          )}
                        </Carousel>
                      </div>
                    )}

                    {/* All Photos - 3 column grid, max 15 images */}
                    {allMedia.length > 0 && (
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">All Photos</h3>
                          {allMedia.length > 15 && (
                            <Button variant="ghost" size="sm" onClick={() => setGalleryPanelOpen(true)}>
                              View all {allMedia.length} photos
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {allMedia.slice(0, 16).map((media, idx) => {
                            return (
                              <motion.button
                                key={media.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => {
                                  setLightboxIndex(idx)
                                  setLightboxOpen(true)
                                }}
                                className="group border-ink bg-sky1 relative aspect-square overflow-hidden rounded-md border-2"
                              >
                                <Image
                                  src={media.cdnUrl || media.url}
                                  alt={media.altText || 'Photo'}
                                  fill
                                  unoptimized={true}
                                  loading={idx < 4 ? 'eager' : 'lazy'}
                                  sizes="(max-width: 640px) 25vw, 20vw"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                {media.type === 'VIDEO' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                                      <Play className="h-3.5 w-3.5 text-foreground" />
                                    </div>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Camera className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground">No Albums Yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      When {vendor.businessName} shares photos, you&apos;ll see them here.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {eventHistory.length > 0 ? (
                  <div className="mx-auto max-w-3xl">
                    <div className="relative pl-6">
                      <div className="absolute bottom-2 left-2 top-2 w-px bg-border" />

                      {eventHistory.map((entry, idx) => {
                        const statusTone = getEventStatusTone(entry.status)

                        return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className="relative pb-5 last:pb-0"
                        >
                          <span className={cn('absolute -left-5.25 top-3 h-3 w-3 rounded-full ring-4 ring-background', statusTone.dot)} />

                          <div className={cn('sk-paper px-5 py-4')}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-semibold text-foreground">
                                {entry.event?.name || 'Event'}
                              </h3>
                              <Badge variant="outline" className={statusTone.badge}>
                                {formatEventVendorStatus(entry.status)}
                              </Badge>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatEventDate(entry.event?.date)}
                              </span>
                              {entry.event?.eventType?.name && (
                                <span className="rounded-full bg-muted px-2 py-0.5">
                                  {entry.event.eventType.name}
                                </span>
                              )}
                              {entry.event?.venueName && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {entry.event.venueName}
                                </span>
                              )}
                              {typeof entry.event?.guestCount === 'number' && (
                                <span>{entry.event.guestCount} guests</span>
                              )}
                            </div>

                            {entry.event?.description && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {entry.event.description}
                              </p>
                            )}

                            {entry.notes && (
                              <p className="mt-2 text-xs text-muted-foreground/90">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CalendarDays className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground">No Events Yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No events have been listed yet.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {services.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {services.filter((s: any) => s.isActive).map((service: any, idx: number) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="sk-paper group px-6 py-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{service.name}</h3>
                              {service.hasItems && service.items?.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <UtensilsCrossed className="mr-1 h-3 w-3" />
                                  {service.items.length} items
                                </Badge>
                              )}
                            </div>
                            {service.description && (
                              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            {service.hasItems && service.items?.length > 0 ? (
                              <>
                                <p className="text-lg font-bold text-foreground">
                                  {formatPrice(Math.min(...service.items.map((i: any) => i.price)), service.currency)} - {formatPrice(Math.max(...service.items.map((i: any) => i.price)), service.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">menu range</p>
                              </>
                            ) : service.startingPrice !== null && service.startingPrice !== undefined ? (
                              <>
                                <p className="text-lg font-bold text-foreground">
                                  {formatPrice(service.startingPrice, service.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">starting price</p>
                              </>
                            ) : service.basePrice !== null && service.basePrice !== undefined ? (
                              <>
                                <p className="text-lg font-bold text-foreground">
                                  {formatPrice(service.basePrice, service.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">price</p>
                              </>
                            ) : (
                              <Badge variant="secondary">Contact for price</Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {getPricingTypeLabel(service.pricingType) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IndianRupee className="h-3 w-3" />
                              {getPricingTypeLabel(service.pricingType)}
                            </span>
                          )}
                          {formatDuration(service.duration) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDuration(service.duration)}
                            </span>
                          )}
                          {service.serviceCities?.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {service.serviceCities.map((sc: any) => sc.city?.name).filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>

                        {service.maxPrice !== null && service.maxPrice !== undefined && service.maxPrice !== service.startingPrice && !service.hasItems && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Up to {formatPrice(service.maxPrice, service.currency)}
                          </p>
                        )}

                        {/* Service Items / Menu Section */}
                        {service.hasItems && service.items?.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <button
                              type="button"
                              className="flex w-full items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
                              onClick={() => setExpandedServiceId(
                                expandedServiceId === service.id ? null : service.id
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <UtensilsCrossed className="h-4 w-4" />
                                View Menu ({service.items.length} items)
                              </span>
                              {expandedServiceId === service.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>

                            <AnimatePresence>
                              {expandedServiceId === service.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 space-y-2">
                                    {service.items
                                      .filter((item: any) => item.isActive)
                                      .map((item: any) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                                        >
                                          {item.imageUrl ? (
                                            <img
                                              src={item.imageUrl}
                                              alt={item.name}
                                              className="h-12 w-12 rounded-md object-cover"
                                            />
                                          ) : (
                                            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <p className="font-medium text-sm truncate">{item.name}</p>
                                              {item.isRequired && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Required</Badge>
                                              )}
                                            </div>
                                            {item.description && (
                                              <p className="text-xs text-muted-foreground truncate">
                                                {item.description}
                                              </p>
                                            )}
                                          </div>
                                          <div className="text-right shrink-0">
                                            <p className="font-semibold text-sm">
                                              {formatPrice(item.price, item.currency || service.currency)}
                                            </p>
                                            {item.unit && (
                                              <p className="text-[10px] text-muted-foreground">
                                                {item.unit}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Zap className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground">No Services Listed</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Contact the vendor directly for service information.
                    </p>
                    {vendorHasMessaging && (
                      <Button className="mt-4" variant="outline" onClick={handleMessageVendor}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Badges Tab */}
            {activeTab === 'badges' && (
              <motion.div
                key="badges"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(() => {
                  type BadgeType = NonNullable<typeof vendor.badges>[number]
                  // Group badges by metric type and get highest threshold for each
                  const badgesByMetric = (vendor.badges || []).reduce((acc, badge) => {
                    const metric = badge.definition?.metric
                    if (!metric) return acc
                    if (!acc[metric] || (badge.definition?.threshold ?? 0) > (acc[metric].definition?.threshold ?? 0)) {
                      acc[metric] = badge
                    }
                    return acc
                  }, {} as Record<string, BadgeType>)

                  // Get current counts for each metric
                  const metricData = [
                    {
                      metric: 'VIEWS',
                      label: 'Profile Views',
                      currentCount: vendor.viewCount ?? 0,
                      icon: Eye,
                      color: 'sky',
                    },
                    {
                      metric: 'LEADS',
                      label: 'Lead Inquiries',
                      currentCount: vendor.leadCount ?? 0,
                      icon: Mail,
                      color: 'emerald',
                    },
                    {
                      metric: 'FOLLOWERS',
                      label: 'Followers',
                      currentCount: vendor.followersCount ?? 0,
                      icon: Users,
                      color: 'violet',
                    },
                    {
                      metric: 'REVIEWS',
                      label: 'Reviews',
                      currentCount: vendorReviews?.length ?? 0,
                      icon: Star,
                      color: 'amber',
                    },
                  ]

                  // Filter to only show metrics where vendor has earned at least one badge
                  const earnedMetrics = metricData.filter(m => badgesByMetric[m.metric])

                  if (earnedMetrics.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Award className="mb-4 h-16 w-16 text-muted-foreground/30" />
                        <h3 className="text-lg font-semibold text-foreground">No Badges Yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Badges are earned as this vendor reaches milestones for followers, reviews, leads, and profile views.
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {earnedMetrics.map((data, idx) => {
                        const badge = badgesByMetric[data.metric]
                        const iconName = badge?.definition?.icon || 'award'
                        const colorName = badge?.definition?.color || data.color
                        const IconComponent = badgeIconMap[iconName] || data.icon
                        const colorClasses = badgeColorMap[colorName] || badgeColorMap.amber
                        const threshold = badge?.definition?.threshold ?? 0

                        // Format the threshold for display
                        const formatThreshold = (num: number) => {
                          if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M+`
                          if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K+`
                          return `${num}+`
                        }

                        return (
                          <motion.div
                            key={data.metric}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                              'flex items-center gap-4 rounded-xl border bg-card p-4 ring-1',
                              colorClasses.ring
                            )}
                          >
                            <div className={cn(
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                              colorClasses.bg
                            )}>
                              <IconComponent className={cn('h-6 w-6', colorClasses.text)} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {formatThreshold(threshold)} {data.label}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {badge?.definition?.name || 'Achievement unlocked'}
                              </p>
                              {badge?.achievedAt && (
                                <p className="mt-1 text-xs text-muted-foreground/70">
                                  Earned {new Date(badge.achievedAt).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews Section */}
        {showReviews && (
        <section className="border-line border-t-2 border-dashed py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[1.8rem] font-semibold">Reviews</h2>
              {vendorReviews.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {vendorReviews.length} review{vendorReviews.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
              <DialogTrigger asChild>
                <SketchButton variant="line" size="sm">
                  <PenLine className="h-4 w-4" />
                  Write a Review
                </SketchButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-120">
                <DialogHeader className="text-center sm:text-center">
                  <DialogTitle className="text-xl">Write a Review</DialogTitle>
                  <DialogDescription>
                    Share your experience with {vendor.businessName}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                  {/* Rating */}
                  <div className="flex flex-col items-center">
                    <p className="mb-3 text-sm font-medium text-foreground">How would you rate your experience?</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'h-8 w-8 transition-colors',
                              star <= (hoveredRating || reviewForm.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {reviewForm.rating === 1 && 'Poor'}
                      {reviewForm.rating === 2 && 'Fair'}
                      {reviewForm.rating === 3 && 'Good'}
                      {reviewForm.rating === 4 && 'Very Good'}
                      {reviewForm.rating === 5 && 'Excellent'}
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <Label htmlFor="reviewTitle" className="text-sm font-medium">
                      Review Title <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="reviewTitle"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Summarize your experience in a few words"
                      className="mt-2"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <Label htmlFor="reviewBody" className="text-sm font-medium">
                      Your Review
                    </Label>
                    <Textarea
                      id="reviewBody"
                      value={reviewForm.body}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, body: e.target.value }))}
                      rows={4}
                      placeholder="Tell others about your experience. What did you like? What could be improved?"
                      className="mt-2 resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setReviewModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitReview}
                      disabled={createReview.isPending}
                    >
                      {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Reviews List */}
          {vendorReviews.length === 0 ? (
            <div className="py-8 text-center">
              <Star className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-x-4 space-y-4  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {vendorReviews.map((review, idx) => {
                const reviewerName = [review.reviewer?.firstName, review.reviewer?.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Client'
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="sk-paper px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{reviewerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{reviewerName}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'h-3 w-3',
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.title && <h4 className="mt-3 text-sm font-medium text-foreground">{review.title}</h4>}
                    {review.body && <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>}
                    {review.reviewNotes && (
                      <div className="mt-3 rounded-md bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground">Vendor Response</p>
                        <p className="mt-1 text-sm text-foreground">{review.reviewNotes}</p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
        )}
      </div>

      {/* Similar Vendors Section */}
      {showSimilarVendors && similarVendors && similarVendors.length > 0 && (
        <section className="border-line border-t-2 border-dashed">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-10">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-display text-[1.8rem] font-semibold">Similar Vendors</h2>
                <p className="mt-1 text-sm text-muted-foreground">More vendors you might like</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vendors">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarVendors.map((similarVendor) => (
                <VendorCard key={similarVendor.id} vendor={similarVendor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full Gallery Panel */}
      <Dialog open={galleryPanelOpen} onOpenChange={setGalleryPanelOpen}>
        <DialogContent className="h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex flex-col p-0 gap-0 sm:rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Images className="h-5 w-5 text-primary" />
                Gallery
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {allMedia.length} photo{allMedia.length !== 1 ? 's' : ''} from {vendor.businessName}
              </DialogDescription>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 md:gap-2.5">
              {allMedia.map((media, idx) => (
                <motion.button
                  key={media.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.01, duration: 0.2 }}
                  type="button"
                  onClick={() => {
                    const mediaIndex = allMedia.findIndex((item) => item.id === media.id)
                    setGalleryPanelOpen(false)
                    setLightboxIndex(mediaIndex)
                    setLightboxOpen(true)
                  }}
                  className="group border-ink bg-sky1 relative aspect-square overflow-hidden rounded-md border-2 transition-all hover:outline-2 hover:outline-offset-2 hover:outline-gold hover:outline-dashed"
                >
                  <Image
                    src={media.cdnUrl || media.url}
                    alt={media.altText || 'Portfolio'}
                    fill
                    unoptimized={true}
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 12vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {media.type === 'VIDEO' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-lg sm:h-8 sm:w-8">
                        <Play className="h-3 w-3 text-foreground sm:h-3.5 sm:w-3.5" />
                      </div>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  {/* Index badge on hover */}
                  <div className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:bottom-1.5 sm:right-1.5 sm:text-xs">
                    {idx + 1}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-3 py-2 sm:px-6 sm:py-3">
            <p className="text-center text-xs text-muted-foreground">
              Click any photo to view in full screen
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Album Detail Dialog */}
      <Dialog open={!!selectedAlbum} onOpenChange={(open) => !open && setSelectedAlbum(null)}>
        <DialogContent className="h-[90vh] max-h-[90vh] w-[90vw] max-w-[900px] flex flex-col p-0 gap-0 sm:rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Images className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate">{selectedAlbum?.title || 'Album'}</span>
              </DialogTitle>
              {selectedAlbum?.description && (
                <DialogDescription className="mt-0.5 text-sm line-clamp-1">
                  {selectedAlbum.description}
                </DialogDescription>
              )}
            </div>
            <Badge variant="secondary" className="ml-3 shrink-0">
              {(selectedAlbum?.mediaItems || []).length} photos
            </Badge>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 md:gap-2.5">
              {(selectedAlbum?.mediaItems || []).map((media, idx) => {
                const mediaIndex = allMedia.findIndex((item) => item.id === media.id)
                return (
                  <motion.button
                    key={media.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    type="button"
                    onClick={() => {
                      setSelectedAlbum(null)
                      setLightboxIndex(mediaIndex >= 0 ? mediaIndex : 0)
                      setLightboxOpen(true)
                    }}
                    className="group border-ink bg-sky1 relative aspect-square overflow-hidden rounded-md border-2 transition-all hover:outline-2 hover:outline-offset-2 hover:outline-gold hover:outline-dashed"
                  >
                    <Image
                      src={media.cdnUrl || media.url}
                      alt={media.altText || selectedAlbum?.title || 'Photo'}
                      fill
                      unoptimized={true}
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                      priority={idx < 6}
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {media.type === 'VIDEO' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-lg sm:h-8 sm:w-8">
                          <Play className="h-3 w-3 text-foreground sm:h-3.5 sm:w-3.5" />
                        </div>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    {/* Index badge on hover */}
                    <div className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:bottom-1.5 sm:right-1.5 sm:text-xs">
                      {idx + 1}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-3 py-2 sm:px-6 sm:py-3">
            <p className="text-center text-xs text-muted-foreground">
              Click any photo to view in full screen
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && allMedia.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation */}
            {allMedia.length > 1 && (
              <>
                <button
                  className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1))
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1))
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {allMedia[lightboxIndex]?.type === 'VIDEO' ? (
                <video
                  src={allMedia[lightboxIndex].url}
                  controls
                  className="max-h-[90vh] max-w-[90vw] rounded-lg"
                />
              ) : (
                <Image
                  src={allMedia[lightboxIndex]?.cdnUrl || allMedia[lightboxIndex]?.url || ''}
                  alt="Portfolio"
                  width={1200}
                  height={800}
                  unoptimized={true}
                  priority={true}
                  className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                />
              )}
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
              {lightboxIndex + 1} / {allMedia.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Get Quote Dialog */}
      {vendor && (
        <GetQuoteDialog
          open={quoteDialogOpen}
          onOpenChange={setQuoteDialogOpen}
          vendorId={vendor.id}
          vendorName={vendor.businessName}
        />
      )}

      {/* Wishlist Dialog */}
      <WishlistPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wishlists={wishlists}
        onConfirm={handleConfirm}
        isSaving={isSaving}
      />
    </main>
  )
}

function VendorDetailSkeleton() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl">
        {/* Banner Skeleton */}
        <Skeleton className="h-40 w-full rounded-b-lg md:h-60" />

        <div className="px-4 md:px-6">
          {/* Avatar + Actions row */}
          <div className="flex items-end justify-between">
            <Skeleton className="-mt-13 h-26 w-26 rounded-full border-4 border-background md:-mt-18 md:h-36 md:w-36" />
            <div className="flex gap-2 pb-3">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>

          {/* Profile info */}
          <div className="mt-3 space-y-2 pb-6">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        {/* Tabs Skeleton */}
        <div className="border-t py-3">
          <div className="flex justify-center gap-8">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="py-6">
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
