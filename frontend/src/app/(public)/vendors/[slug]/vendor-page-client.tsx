'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { usePublicVendor, usePublicVendors } from '@/hooks/queries/use-public-vendors'
import { useAuthStore } from '@/store/auth-store'
import { WishlistPickerDialog } from '@/components/common/wishlist-picker-dialog'
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
  Grid3X3,
  CalendarDays,
  Camera,
  Sparkles,
  IndianRupee,
  Clock,
  PenLine,
  Zap,
} from 'lucide-react'
import type { VendorProfile as VendorProfileType } from '@/lib/api/types/business.types'
import type { VendorProfile } from '@/lib/api/types/vendor.types'
import { cn } from '@/lib/utils'

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

const formatPrice = (price?: number | null) => {
  if (!price) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

type VendorPageClientProps = {
  slug: string
  initialVendor?: VendorProfile | null
}

export default function VendorPageClient({ slug, initialVendor }: VendorPageClientProps) {
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
    { enabled: !!categoryId },
  )

  // Filter out the current vendor from similar vendors
  const similarVendors = (similarVendorsData?.data || []).filter(v => v.id !== vendor?.id).slice(0, 4)

  const wishlistsQuery = useWishlistMine(Boolean(userId))
  const wishlists = (Array.isArray(wishlistsQuery.data) ? wishlistsQuery.data : []) as import('@/lib/api/types/wishlist.types').Wishlist[]
  const createWishlist = useCreateWishlist(userId ?? '')
  const addItem = useAddWishlistItem()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [locallySaved, setLocallySaved] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'events' | 'services' | 'badges'>('portfolio')
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)

  const { mutateAsync: createConversation, isPending: isCreatingConversation } =
    useCreateUserVendorConversation()

  const isSaved =
    locallySaved ||
    (Array.isArray(wishlists) && wishlists.some((list) =>
      list.items?.some((item: { vendorProfileId?: string }) => item.vendorProfileId === vendor?.id)
    ))

  const handleSave = () => {
    if (!userId) {
      router.push('/login')
      return
    }
    if (isSaved || isSaving) return
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
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    const conversation = await createConversation(vendor.id)
    router.push(`/messages?conversationId=${conversation.id}`)
  }

  const followStatus = useVendorFollowStatus(vendor?.id || '', Boolean(userId))
  const toggleFollow = useToggleVendorFollow()
  const { data: vendorReviews = [] } = useVendorReviews(vendor?.id || '')
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

    setReviewForm({ rating: 5, title: '', body: '' })
    setReviewModalOpen(false)
    toast.success('Review submitted successfully!')
  }

  if (isLoading) {
    return <VendorDetailSkeleton />
  }

  if (error || !vendor) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-[60vh] max-w-[935px] flex-col items-center justify-center px-4 py-16">
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

  // Get all media items from portfolios
  const allMedia = portfolios.flatMap((p) => p.mediaItems || [])

  // Calculate member since year
  const memberSince = vendor.createdAt
    ? new Date(vendor.createdAt).getFullYear()
    : null

  // Get events count (using portfolios count as proxy)
  const eventsCount = portfolios.length || 0

  // Calculate average rating
  const avgRating = vendorReviews.length > 0
    ? (vendorReviews.reduce((acc, r) => acc + r.rating, 0) / vendorReviews.length).toFixed(1)
    : null

  const tabs = [
    { id: 'portfolio' as const, label: 'Portfolio', icon: Grid3X3 },
    { id: 'events' as const, label: 'Events', icon: CalendarDays },
    { id: 'services' as const, label: 'Services', icon: Sparkles },
    { id: 'badges' as const, label: 'Cert/Badges', icon: Award },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Instagram-style centered container */}
      <div className="mx-auto max-w-[935px] px-4 py-8">
        {/* Profile Header Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-10"
        >
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            {/* Profile Avatar with Ring */}
            <div className="relative shrink-0">
              <div className="relative h-[150px] w-[150px] rounded-full p-[3px] md:h-[168px] md:w-[168px]">
                {/* Gradient Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-primary/80 to-primary/60" />
                {/* Inner Container */}
                <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-background">
                  {vendor.profilePhotoUrl ? (
                    <Image
                      src={vendor.profilePhotoUrl}
                      alt={vendor.businessName || ''}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-4xl font-bold text-muted-foreground">
                      {vendor.businessName?.charAt(0) || 'V'}
                    </div>
                  )}
                </div>
              </div>
              {/* Verified Badge */}
              {isVerified && (
                <div className="absolute -bottom-1 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg ring-2 ring-background">
                  <Star className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {/* Business Name & Actions Row */}
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
                <h1 className="text-xl font-normal text-foreground">
                  {vendor.businessName}
                </h1>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleMessageVendor}
                    disabled={isCreatingConversation}
                    size="sm"
                    className="gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFollow}
                    className="gap-1.5"
                  >
                    {followStatus.data?.following ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {followStatus.data?.following ? 'Following' : 'Follow'}
                  </Button>
                  {vendor.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(vendor.website || '#', '_blank')}
                      className="gap-1.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </Button>
                  )}
                </div>
              </div>

              {/* Verified Badge */}
              {isVerified && (
                <Badge className="mt-3 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20">
                  <Star className="h-3 w-3 fill-primary" />
                  Verified Vendor
                </Badge>
              )}

              {/* Stats Row */}
              <div className="mt-5 flex items-center justify-center gap-8 md:justify-start">
                <div className="text-center md:text-left">
                  <span className="font-semibold text-foreground">{eventsCount}</span>
                  <span className="ml-1 text-muted-foreground">events</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-semibold text-foreground">
                    {formatFollowers(vendor.followersCount ?? 0)}
                  </span>
                  <span className="ml-1 text-muted-foreground">followers</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-semibold text-foreground">{allMedia.length}</span>
                  <span className="ml-1 text-muted-foreground">photos</span>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1 text-center md:text-left">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{avgRating}</span>
                    <span className="text-muted-foreground">({vendorReviews.length})</span>
                  </div>
                )}
              </div>

              {/* Business Name (Bold) */}
              <p className="mt-4 font-semibold text-foreground">
                {vendor.businessName}
              </p>

              {/* Category */}
              {category?.name && (
                <p className="text-sm text-muted-foreground">{category.name}</p>
              )}

              {/* Tagline/Bio */}
              {vendor.tagline && (
                <p className="mt-1 text-sm text-foreground">
                  {vendor.tagline}
                </p>
              )}

              {/* Location & Since */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-start">
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
            </div>
          </div>
        </motion.section>

        {/* Tab Navigation */}
        <div className="border-t">
          <div className="flex justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 border-t px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors -mt-px',
                    isActive
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
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
                {allMedia.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {allMedia.map((media, idx) => (
                      <motion.button
                        key={media.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => {
                          setLightboxIndex(idx)
                          setLightboxOpen(true)
                        }}
                        className="group relative aspect-square overflow-hidden bg-muted"
                      >
                        <Image
                          src={media.cdnUrl || media.url}
                          alt={media.altText || 'Portfolio'}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {media.type === 'VIDEO' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                              <Play className="h-5 w-5 text-foreground" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                          <div className="flex items-center gap-4 text-white">
                            <span className="flex items-center gap-1">
                              <Star className="h-5 w-5 fill-white" />
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Camera className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground">No Posts Yet</h3>
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
                {portfolios.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {portfolios.map((portfolio, idx) => (
                      <motion.div
                        key={portfolio.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/50"
                      >
                        {portfolio.mediaItems?.[0] && (
                          <div className="relative aspect-video overflow-hidden">
                            <Image
                              src={portfolio.mediaItems[0].cdnUrl || portfolio.mediaItems[0].url}
                              alt={portfolio.title || 'Event'}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                              <Badge variant="secondary" className="bg-white/90 text-foreground">
                                {portfolio.mediaItems.length} photos
                              </Badge>
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground">{portfolio.title || 'Untitled Event'}</h3>
                          {portfolio.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {portfolio.description}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
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
                        className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{service.name}</h3>
                            {service.description && (
                              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            {service.startingPrice || service.basePrice ? (
                              <>
                                <p className="text-lg font-bold text-foreground">
                                  {formatPrice(service.startingPrice || service.basePrice)}
                                </p>
                                <p className="text-xs text-muted-foreground">starting price</p>
                              </>
                            ) : (
                              <Badge variant="secondary">Contact for price</Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {service.pricingType && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IndianRupee className="h-3 w-3" />
                              {service.pricingType === 'FIXED' ? 'Fixed Price' :
                               service.pricingType === 'HOURLY' ? 'Per Hour' :
                               service.pricingType === 'DAILY' ? 'Per Day' : service.pricingType}
                            </span>
                          )}
                          {service.duration && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {service.duration}
                            </span>
                          )}
                        </div>

                        {service.maxPrice && service.maxPrice !== service.startingPrice && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Up to {formatPrice(service.maxPrice)}
                          </p>
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
                    <Button className="mt-4" variant="outline" onClick={handleMessageVendor}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
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
                {(vendor.badges?.length || 0) > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {vendor.badges?.map((badge, idx) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-4 rounded-lg border bg-card p-4"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                          <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {badge.definition?.name || 'Achievement'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {badge.definition?.description || 'Earned badge'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Award className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <h3 className="text-lg font-semibold text-foreground">No Badges Yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No badges or certifications have been earned yet.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews Section */}
        <section className="border-t py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
              {vendorReviews.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {vendorReviews.length} review{vendorReviews.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <PenLine className="h-4 w-4" />
                  Write a Review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
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
            <div className="space-y-4">
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
                    className="rounded-lg border bg-card p-4"
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
      </div>

      {/* Similar Vendors Section */}
      {similarVendors && similarVendors.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-[935px] px-4 py-10">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Similar Vendors</h2>
                <p className="mt-1 text-sm text-muted-foreground">More vendors you might like</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vendors">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarVendors.map((similarVendor) => (
                <VendorCard key={similarVendor.id} vendor={similarVendor} />
              ))}
            </div>
          </div>
        </section>
      )}

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
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[935px] px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex flex-col items-center gap-8 pb-10 md:flex-row md:items-start">
          <Skeleton className="h-[150px] w-[150px] rounded-full md:h-[168px] md:w-[168px]" />
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
            <div className="flex justify-center gap-8 md:justify-start">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="mx-auto h-4 w-32 md:mx-0" />
            <Skeleton className="mx-auto h-4 w-64 md:mx-0" />
            <Skeleton className="mx-auto h-4 w-40 md:mx-0" />
          </div>
        </div>

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
