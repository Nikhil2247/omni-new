'use client'

import { useEffect, useMemo, useRef, useState, type ElementType } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import {
  useBusinessProfile,
  useCreateBusinessProfile,
  useUpdateBusinessProfile,
  useSubmitForVerification,
  useGenerateSlug,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
} from '@/hooks/queries/use-business'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  Award,
  CalendarDays,
  Camera,
  CheckCircle,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  Globe,
  ImageIcon,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Play,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Upload,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { VendorStatus } from '@/lib/api/types/business.types'
import { getMinioViewUrl } from '@/lib/utils/minio'

const statusConfig: Record<VendorStatus, { label: string; color: string; icon: ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Edit },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertTriangle },
}

const CATEGORIES = [
  { id: 'photography', name: 'Photography' },
  { id: 'videography', name: 'Videography' },
  { id: 'catering', name: 'Catering' },
  { id: 'decoration', name: 'Decoration' },
  { id: 'venue', name: 'Venue' },
  { id: 'music-entertainment', name: 'Music & Entertainment' },
  { id: 'florist', name: 'Florist' },
  { id: 'makeup-hair', name: 'Makeup & Hair' },
]

const slugifyBusinessName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

type TabId = 'portfolio' | 'events' | 'services' | 'badges'

const formatPrice = (price?: number | null) => {
  if (!price) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

const formatDate = (date?: string | null) => {
  if (!date) return 'Date TBA'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function BusinessProfilePage() {
  const { data: profile, isLoading, error } = useBusinessProfile()
  const createProfile = useCreateBusinessProfile()
  const updateProfile = useUpdateBusinessProfile()
  const submitVerification = useSubmitForVerification()
  const generateSlug = useGenerateSlug()
  const uploadPhoto = useUploadProfilePhoto()
  const deletePhoto = useDeleteProfilePhoto()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const createPhotoInputRef = useRef<HTMLInputElement>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('portfolio')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [createPhotoFile, setCreatePhotoFile] = useState<File | null>(null)
  const [createPhotoPreviewUrl, setCreatePhotoPreviewUrl] = useState('')
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    categoryId: '',
    tagline: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    serviceRadius: '',
  })

  useEffect(() => {
    if (!profile) return
    setFormData({
      businessName: profile.businessName || '',
      slug: profile.slug || '',
      categoryId: profile.categoryId || '',
      tagline: profile.tagline || '',
      description: profile.description || '',
      contactEmail: profile.contactEmail || '',
      contactPhone: profile.contactPhone || '',
      website: profile.website || '',
      serviceRadius: profile.serviceRadius?.toString() || '',
    })
  }, [profile])

  useEffect(() => {
    if (profile || isSlugManuallyEdited) return

    const nextSlug = slugifyBusinessName(formData.businessName)
    setFormData((prev) => (prev.slug === nextSlug ? prev : { ...prev, slug: nextSlug }))
  }, [formData.businessName, isSlugManuallyEdited, profile])

  useEffect(() => {
    return () => {
      if (createPhotoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createPhotoPreviewUrl)
      }
    }
  }, [createPhotoPreviewUrl])

  const handleGenerateSlug = async () => {
    if (!formData.businessName) return
    const result = await generateSlug.mutateAsync(formData.businessName)
    setIsSlugManuallyEdited(true)
    setFormData(prev => ({ ...prev, slug: result.slug }))
  }

  const handleCreatePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    const localPreview = URL.createObjectURL(file)
    setCreatePhotoPreviewUrl((prev) => {
      if (prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev)
      }
      return localPreview
    })
    setCreatePhotoFile(file)

    if (createPhotoInputRef.current) {
      createPhotoInputRef.current.value = ''
    }
  }

  const handleCreate = async () => {
    try {
      await createProfile.mutateAsync({
        businessName: formData.businessName,
        slug: formData.slug.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        tagline: formData.tagline || undefined,
        description: formData.description || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        serviceRadius: formData.serviceRadius ? parseInt(formData.serviceRadius, 10) : undefined,
      })

      if (createPhotoFile) {
        await uploadPhoto.mutateAsync(createPhotoFile)
      }

      setShowCreateDialog(false)
      setCreatePhotoFile(null)
      setCreatePhotoPreviewUrl((prev) => {
        if (prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev)
        }
        return ''
      })
      toast.success('Business profile created')
    } catch (createError: any) {
      toast.error(createError?.message || 'Failed to create profile')
    }
  }

  const handleUpdate = () => {
    updateProfile.mutate(
      {
        businessName: formData.businessName,
        slug: formData.slug || undefined,
        categoryId: formData.categoryId || undefined,
        tagline: formData.tagline || undefined,
        description: formData.description || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        serviceRadius: formData.serviceRadius ? parseInt(formData.serviceRadius, 10) : undefined,
      },
      {
        onSuccess: () => {
          setShowManageDialog(false)
          toast.success('Profile updated')
        },
      },
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    uploadPhoto.mutate(file, {
      onSuccess: () => toast.success('Profile photo updated'),
      onError: (uploadError: any) => toast.error(uploadError?.message || 'Failed to upload photo'),
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeletePhoto = () => {
    deletePhoto.mutate(undefined, {
      onSuccess: () => toast.success('Profile photo deleted'),
      onError: (deleteError: any) => toast.error(deleteError?.message || 'Failed to delete photo'),
    })
  }

  const portfolios = profile?.portfolios || []
  const allMedia = portfolios.flatMap((portfolio) => portfolio.mediaItems || [])

  const normalizedMedia = useMemo(
    () =>
      allMedia.map((media) => ({
        ...media,
        viewerUrl: getMinioViewUrl(media.cdnUrl || media.url || media.thumbnailUrl || ''),
        viewerThumbnailUrl: getMinioViewUrl(media.thumbnailUrl || media.cdnUrl || media.url || ''),
      })),
    [allMedia],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-105 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl border bg-card p-8 text-center sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold">Create your business profile</h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl">
            Set up your profile and publish your business identity.
          </p>
          <Button className="mt-6" size="lg" onClick={() => setShowCreateDialog(true)}>
            <Store className="mr-2 h-4 w-4" />
            Create Profile
          </Button>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Business Profile</DialogTitle>
              <DialogDescription>Fill in your details to create your profile.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input value={formData.businessName} onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))} placeholder="Your Business Name" />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.slug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true)
                        setFormData(prev => ({ ...prev, slug: slugifyBusinessName(e.target.value) }))
                      }}
                      placeholder="your-business-name"
                    />
                    <Button type="button" variant="outline" onClick={handleGenerateSlug} disabled={!formData.businessName || generateSlug.isPending}>
                      {generateSlug.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                    </Button>
                  </div>
                </div>
              </div>

              <input
                ref={createPhotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCreatePhotoSelect}
                className="hidden"
              />

              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => createPhotoInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {createPhotoFile ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {createPhotoFile && (
                    <span className="text-xs text-muted-foreground">{createPhotoFile.name}</span>
                  )}
                </div>
                {createPhotoPreviewUrl && (
                  <div className="h-28 w-28 overflow-hidden rounded-full border bg-muted">
                    <NextImage
                      src={createPhotoPreviewUrl}
                      alt="Profile preview"
                      width={224}
                      height={224}
                      unoptimized={true}
                      priority={true}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={formData.tagline} onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Short tagline" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={4} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe your services..." />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" value={formData.contactEmail} onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={formData.contactPhone} onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={formData.website} onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Service Radius (miles)</Label>
                  <Input type="number" value={formData.serviceRadius} onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: e.target.value }))} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createProfile.isPending || uploadPhoto.isPending || !formData.businessName}>
                {createProfile.isPending || uploadPhoto.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    )
  }

  const status = statusConfig[profile.status] || statusConfig.DRAFT
  const StatusIcon = status.icon

  const services = profile.services || []
  const badges = profile.badges || []
  const eventHistory = profile.eventHistory || []
  const profilePhotoViewUrl = profile.profilePhotoUrl
    ? getMinioViewUrl(profile.profilePhotoUrl) || profile.profilePhotoUrl
    : null

  const tabs = [
    { id: 'portfolio' as const, label: 'Portfolio', icon: ImageIcon },
    { id: 'events' as const, label: 'Events', icon: CalendarDays },
    { id: 'services' as const, label: 'Services', icon: Sparkles },
    { id: 'badges' as const, label: 'Badges', icon: Award },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <section className="pb-10">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="relative shrink-0">
              <div className="relative h-37.5 w-37.5 rounded-full p-0.75 md:h-42 md:w-42">
                <div className="absolute inset-0 rounded-full bg-linear-to-tr from-primary via-primary/80 to-primary/60" />
                <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-background">
                  {profilePhotoViewUrl ? (
                    <NextImage
                      src={profilePhotoViewUrl}
                      alt={profile.businessName || ''}
                      width={336}
                      height={336}
                      unoptimized={true}
                      priority={true}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-4xl font-bold text-muted-foreground">
                      {profile.businessName?.charAt(0) || 'B'}
                    </div>
                  )}
                </div>
              </div>
              {profile.verifiedAt && (
                <div className="absolute -bottom-1 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg ring-2 ring-background">
                  <CheckCircle className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">{profile.businessName}</h1>
                  {profile.tagline && <p className="mt-1 text-sm text-muted-foreground">{profile.tagline}</p>}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
                  <Badge variant="outline" className={status.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>

                  {profile.status === 'DRAFT' && (
                    <Button onClick={() => submitVerification.mutate()} disabled={submitVerification.isPending}>
                      {submitVerification.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Submit Verification
                    </Button>
                  )}

                  <Button variant="outline" asChild>
                    <Link href={`/vendors/${profile.slug}`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Public Page
                    </Link>
                  </Button>

                  <Button onClick={() => setShowManageDialog(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Views</p>
                  <p className="mt-1 text-lg font-semibold">{profile.viewCount || 0}</p>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Followers</p>
                  <p className="mt-1 text-lg font-semibold">{profile.followersCount || 0}</p>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Reviews</p>
                  <p className="mt-1 text-lg font-semibold">{profile.reviewsCount || 0}</p>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Portfolio</p>
                  <p className="mt-1 text-lg font-semibold">{allMedia.length}</p>
                </div>
              </div>

              {profile.description && (
                <p className="mt-5 whitespace-pre-wrap text-sm text-foreground/90">{profile.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground md:justify-start">
                {profile.contactEmail && (
                  <a href={`mailto:${profile.contactEmail}`} className="inline-flex items-center gap-1 hover:text-foreground">
                    <Mail className="h-4 w-4" />
                    {profile.contactEmail}
                  </a>
                )}
                {profile.contactPhone && (
                  <a href={`tel:${profile.contactPhone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                    <Phone className="h-4 w-4" />
                    {profile.contactPhone}
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {profile.serviceRadius && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.serviceRadius} miles
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t py-3">
          <div className="mx-auto flex max-w-3xl justify-center gap-3 sm:gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition ${active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="py-6">
          {activeTab === 'portfolio' && (
            <>
              {normalizedMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Camera className="mb-4 h-16 w-16 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-foreground">No Portfolio Media</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Upload portfolio media to showcase your work.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {normalizedMedia.map((media) => {
                    const mediaUrl = media.viewerUrl
                    const thumbnailUrl = media.viewerThumbnailUrl
                    return (
                      <div key={media.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
                        {media.type === 'VIDEO' ? (
                          <>
                            {thumbnailUrl ? (
                              <NextImage
                                src={thumbnailUrl}
                                alt={media.altText || 'Portfolio video'}
                                width={800}
                                height={800}
                                unoptimized={true}
                                priority={true}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <Play className="h-10 w-10 text-muted-foreground/60" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="h-10 w-10 text-white" />
                            </div>
                          </>
                        ) : (
                          mediaUrl ? (
                            <NextImage
                              src={mediaUrl}
                              alt={media.altText || 'Portfolio image'}
                              width={800}
                              height={800}
                              unoptimized={true}
                              priority={true}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'events' && (
            <>
              {eventHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <CalendarDays className="mb-4 h-16 w-16 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-foreground">No Event History Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Event collaborations will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventHistory.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="text-base font-semibold text-foreground">{item.event?.name || 'Event'}</h3>
                        <Badge variant="outline" className="w-fit">{item.status || 'N/A'}</Badge>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="leading-5">{formatDate(item.event?.date)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="leading-5">{item.event?.venueName || 'Venue TBA'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="leading-5">{item.event?.guestCount ? `${item.event.guestCount} guests` : 'Guest count N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="leading-5">{item.event?.eventType?.name || 'Event type N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'services' && (
            <>
              {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Sparkles className="mb-4 h-16 w-16 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-foreground">No Services Listed</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Add services to highlight your offerings.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {services.map((service) => (
                    <div key={service.id} className="rounded-xl border bg-card p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        {service.basePrice ? (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                            <IndianRupee className="h-4 w-4" />
                            {formatPrice(service.basePrice)}
                          </span>
                        ) : null}
                      </div>
                      {service.description && <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'badges' && (
            <>
              {badges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Award className="mb-4 h-16 w-16 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-foreground">No Badges Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Achievement badges and certifications will show here.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((badge) => (
                    <div key={badge.id} className="rounded-xl border bg-card p-4">
                      <h3 className="font-semibold text-foreground">{badge.definition?.name || 'Achievement'}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{badge.definition?.description || 'Earned badge'}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Profile</DialogTitle>
            <DialogDescription>Edit all profile fields shown in your profile page.</DialogDescription>
          </DialogHeader>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />

          <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending}>
                {uploadPhoto.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload / Change Photo
              </Button>
              {profile.profilePhotoUrl && (
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDeletePhoto} disabled={deletePhoto.isPending}>
                  {deletePhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={formData.businessName} onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.slug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true)
                      setFormData(prev => ({ ...prev, slug: slugifyBusinessName(e.target.value) }))
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleGenerateSlug} disabled={!formData.businessName || generateSlug.isPending}>
                    {generateSlug.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={formData.tagline} onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Add a short tagline" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={4} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={formData.contactEmail} onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input value={formData.contactPhone} onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={formData.website} onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Service Radius (miles)</Label>
                <Input type="number" value={formData.serviceRadius} onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: e.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
