'use client'

import { useEffect, useMemo, useRef, useState, type ElementType } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  useBusinessProfile,
  useCreateBusinessProfile,
  useUpdateBusinessProfile,
  useSubmitForVerification,
  useGenerateSlug,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
  useUploadProfileBanner,
  useDeleteProfileBanner,
} from '@/hooks/queries/use-business'
import { useCategories, useCities } from '@/hooks/queries/use-lookups'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ImageCropperDialog } from '@/components/common/image-cropper-dialog'
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
  Archive,
  Award,
  CalendarDays,
  Camera,
  CheckCircle,
  Clock,
  Edit,
  ExternalLink,
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
  UserX,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { VendorStatus } from '@/lib/api/types/business.types'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { FeatureFlagGate, FeatureDisabledMessage } from '@/components/common'

const statusConfig: Record<VendorStatus, { label: string; color: string; icon: ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Edit },
  UNCLAIMED: { label: 'Unclaimed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserX },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Archive },
}

const slugifyBusinessName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

type TabId = 'portfolio' | 'events' | 'services' | 'badges'
type CropTarget = 'createPhoto' | 'createBanner' | 'managePhoto' | 'manageBanner'

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

const containsHtml = (value?: string | null) => {
  if (!value) return false
  return /<[^>]+>/.test(value)
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

export default function BusinessProfilePage() {
  useEffect(() => {
    trackDashboard.sectionView('profile', 'vendor')
  }, [])

  const { data: profile, isLoading, error } = useBusinessProfile()
  const createProfile = useCreateBusinessProfile()
  const updateProfile = useUpdateBusinessProfile()
  const submitVerification = useSubmitForVerification()
  const generateSlug = useGenerateSlug()
  const uploadPhoto = useUploadProfilePhoto()
  const deletePhoto = useDeleteProfilePhoto()
  const uploadBanner = useUploadProfileBanner()
  const deleteBanner = useDeleteProfileBanner()
  const { data: cities = [] } = useCities()
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const createPhotoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const createBannerInputRef = useRef<HTMLInputElement>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('portfolio')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [createPhotoFile, setCreatePhotoFile] = useState<File | null>(null)
  const [createPhotoPreviewUrl, setCreatePhotoPreviewUrl] = useState('')
  const [createBannerFile, setCreateBannerFile] = useState<File | null>(null)
  const [createBannerPreviewUrl, setCreateBannerPreviewUrl] = useState('')
  const [managePhotoFile, setManagePhotoFile] = useState<File | null>(null)
  const [manageBannerFile, setManageBannerFile] = useState<File | null>(null)
  const [managePhotoPreviewUrl, setManagePhotoPreviewUrl] = useState('')
  const [manageBannerPreviewUrl, setManageBannerPreviewUrl] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    categoryId: '',
    tagline: '',
    bannerImageUrl: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    serviceRadius: '',
    serviceAreaCityIds: [] as string[],
  })
  const [selectedServiceCityId, setSelectedServiceCityId] = useState('')

  useEffect(() => {
    if (!profile) return
    setFormData({
      businessName: profile.businessName || '',
      slug: profile.slug || '',
      categoryId: profile.categoryId || '',
      tagline: profile.tagline || '',
      bannerImageUrl: profile.bannerImageUrl || '',
      contactEmail: profile.contactEmail || '',
      contactPhone: profile.contactPhone || '',
      website: profile.website || '',
      serviceRadius: profile.serviceRadius?.toString() || '',
      serviceAreaCityIds: (profile.serviceAreas || []).map((serviceArea) => serviceArea.cityId),
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

      if (createBannerPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createBannerPreviewUrl)
      }

      if (managePhotoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(managePhotoPreviewUrl)
      }

      if (manageBannerPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(manageBannerPreviewUrl)
      }
    }
  }, [createPhotoPreviewUrl, createBannerPreviewUrl, managePhotoPreviewUrl, manageBannerPreviewUrl])

  const handleGenerateSlug = async () => {
    if (!formData.businessName) return
    const result = await generateSlug.mutateAsync(formData.businessName)
    setIsSlugManuallyEdited(true)
    setFormData(prev => ({ ...prev, slug: result.slug }))
  }

  const cropConfigByTarget: Record<CropTarget, {
    title: string
    description: string
    aspect: number
    outputWidth: number
    outputHeight: number
    cropShape: 'rect' | 'round'
  }> = {
    createPhoto: {
      title: 'Crop Profile Photo',
      description: 'Adjust and resize your profile photo before upload.',
      aspect: 1,
      outputWidth: 800,
      outputHeight: 800,
      cropShape: 'round',
    },
    managePhoto: {
      title: 'Crop Profile Photo',
      description: 'Adjust and resize your profile photo before upload.',
      aspect: 1,
      outputWidth: 800,
      outputHeight: 800,
      cropShape: 'round',
    },
    createBanner: {
      title: 'Crop Profile Banner',
      description: 'Adjust and resize your banner image before upload.',
      aspect: 1500 / 400,
      outputWidth: 1500,
      outputHeight: 400,
      cropShape: 'rect',
    },
    manageBanner: {
      title: 'Crop Profile Banner',
      description: 'Adjust and resize your banner image before upload.',
      aspect: 1500 / 400,
      outputWidth: 1500,
      outputHeight: 400,
      cropShape: 'rect',
    },
  }

  const beginCropFlow = (
    file: File,
    target: CropTarget,
    maxSize: number,
    sizeErrorMessage: string,
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > maxSize) {
      toast.error(sizeErrorMessage)
      return
    }

    setCropFile(file)
    setCropTarget(target)
    setIsCropDialogOpen(true)
  }

  const handleCreatePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    beginCropFlow(file, 'createPhoto', 10 * 1024 * 1024, 'File size must be less than 10MB')

    if (createPhotoInputRef.current) {
      createPhotoInputRef.current.value = ''
    }
  }

  const handleCreateBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    beginCropFlow(file, 'createBanner', 15 * 1024 * 1024, 'Banner size must be less than 15MB')

    if (createBannerInputRef.current) {
      createBannerInputRef.current.value = ''
    }
  }

  const handleCreate = async () => {
    try {
      await createProfile.mutateAsync({
        businessName: formData.businessName,
        slug: formData.slug.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        tagline: formData.tagline || undefined,
        bannerImageUrl: formData.bannerImageUrl.trim() || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        serviceRadius: formData.serviceRadius ? parseInt(formData.serviceRadius, 10) : undefined,
        serviceAreaCityIds: formData.serviceAreaCityIds.length ? formData.serviceAreaCityIds : undefined,
      })

      if (createPhotoFile) {
        await uploadPhoto.mutateAsync(createPhotoFile)
      }

      if (createBannerFile) {
        await uploadBanner.mutateAsync(createBannerFile)
      }

      setShowCreateDialog(false)
      setCreatePhotoFile(null)
      setCreateBannerFile(null)
      setCreatePhotoPreviewUrl((prev) => {
        if (prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev)
        }
        return ''
      })
      setCreateBannerPreviewUrl((prev) => {
        if (prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev)
        }
        return ''
      })
      toast.success('Business profile created')
    } catch (createError: unknown) {
      toast.error(getErrorMessage(createError, 'Failed to create profile'))
    }
  }

  const handleUpdate = async () => {
    try {
      await updateProfile.mutateAsync({
        businessName: formData.businessName,
        slug: formData.slug || undefined,
        categoryId: formData.categoryId || undefined,
        tagline: formData.tagline || undefined,
        bannerImageUrl: formData.bannerImageUrl.trim() || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        serviceRadius: formData.serviceRadius ? parseInt(formData.serviceRadius, 10) : undefined,
        serviceAreaCityIds: formData.serviceAreaCityIds,
      })

      if (managePhotoFile) {
        await uploadPhoto.mutateAsync(managePhotoFile)
      }

      if (manageBannerFile) {
        await uploadBanner.mutateAsync(manageBannerFile)
      }

      setManagePhotoFile(null)
      setManageBannerFile(null)
      setShowManageDialog(false)
      toast.success('Profile updated')
    } catch (updateError: unknown) {
      toast.error(getErrorMessage(updateError, 'Failed to update profile'))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    beginCropFlow(file, 'managePhoto', 10 * 1024 * 1024, 'File size must be less than 10MB')

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    beginCropFlow(file, 'manageBanner', 15 * 1024 * 1024, 'Banner size must be less than 15MB')

    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  const handleDeletePhoto = () => {
    deletePhoto.mutate(undefined, {
      onSuccess: () => toast.success('Profile photo deleted'),
      onError: (deleteError: unknown) =>
        toast.error(getErrorMessage(deleteError, 'Failed to delete photo')),
    })
  }

  const handleDeleteBanner = () => {
    deleteBanner.mutate(undefined, {
      onSuccess: () => toast.success('Profile banner deleted'),
      onError: (deleteError: unknown) =>
        toast.error(getErrorMessage(deleteError, 'Failed to delete banner')),
    })
  }

  const handleCropConfirm = async (processedFile: File, previewUrl: string) => {
    if (!cropTarget) {
      URL.revokeObjectURL(previewUrl)
      return
    }

    if (cropTarget === 'createPhoto') {
      setCreatePhotoPreviewUrl((prev) => {
        if (prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev)
        }
        return previewUrl
      })
      setCreatePhotoFile(processedFile)
      return
    }

    if (cropTarget === 'createBanner') {
      setCreateBannerPreviewUrl((prev) => {
        if (prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev)
        }
        return previewUrl
      })
      setCreateBannerFile(processedFile)
      return
    }

    if (cropTarget === 'managePhoto') {
      setManagePhotoFile(processedFile)
      setManagePhotoPreviewUrl((prev) => {
        if (prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev)
        }
        return previewUrl
      })
      toast.success('Profile photo ready. Click Save Changes to upload.')
      return
    }

    setManageBannerFile(processedFile)
    setManageBannerPreviewUrl((prev) => {
      if (prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev)
      }
      return previewUrl
    })
    toast.success('Profile banner ready. Click Save Changes to upload.')
  }

  const handleCropOpenChange = (open: boolean) => {
    setIsCropDialogOpen(open)
    if (!open) {
      setCropFile(null)
      setCropTarget(null)
    }
  }

  const addServiceCity = () => {
    if (!selectedServiceCityId) return

    setFormData((prev) => ({
      ...prev,
      serviceAreaCityIds: prev.serviceAreaCityIds.includes(selectedServiceCityId)
        ? prev.serviceAreaCityIds
        : [...prev.serviceAreaCityIds, selectedServiceCityId],
    }))
    setSelectedServiceCityId('')
  }

  const removeServiceCity = (cityId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreaCityIds: prev.serviceAreaCityIds.filter((id) => id !== cityId),
    }))
  }

  const portfolios = profile?.portfolios || []
  const featuredPortfolio = portfolios.find((portfolio) => portfolio.isFeatured) || null
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

  const normalizedFeaturedMedia = useMemo(() => {
    if (!featuredPortfolio?.mediaItems?.length) {
      return []
    }

    return featuredPortfolio.mediaItems.map((media) => ({
      ...media,
      viewerUrl: getMinioViewUrl(media.cdnUrl || media.url || media.thumbnailUrl || ''),
      viewerThumbnailUrl: getMinioViewUrl(media.thumbnailUrl || media.cdnUrl || media.url || ''),
    }))
  }, [featuredPortfolio])

  const cityNameById = useMemo(
    () => new Map(cities.map((city) => [city.id, city.name])),
    [cities],
  )

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive !== false),
    [categories],
  )

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === formData.categoryId),
    [categories, formData.categoryId],
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
      <FeatureFlagGate
        feature="vendor.onboarding"
        fallback={
          <FeatureDisabledMessage
            feature="Business Profile Setup"
            description="Business profile creation is currently unavailable. Please check back later."
            backUrl="/business/dashboard"
            backText="Go to Dashboard"
          />
        }
      >
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

              <input
                ref={createBannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCreateBannerSelect}
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
                <Label>Profile Banner</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => createBannerInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {createBannerFile ? 'Change Banner' : 'Upload Banner'}
                  </Button>
                  {createBannerFile && (
                    <span className="text-xs text-muted-foreground">{createBannerFile.name}</span>
                  )}
                </div>
                {createBannerPreviewUrl && (
                  <div className="h-32 w-full overflow-hidden rounded-xl border bg-muted">
                    <NextImage
                      src={createBannerPreviewUrl}
                      alt="Banner preview"
                      width={1200}
                      height={320}
                      unoptimized={true}
                      priority={true}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.categoryId || undefined}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!categoriesLoading && activeCategories.length === 0 ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-dashed p-2">
                    <p className="text-xs text-muted-foreground">No categories available right now.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchCategories()}>
                      Retry
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={formData.tagline} onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Short tagline" />
              </div>

              <div className="space-y-2">
                <Label>Banner Image URL</Label>
                <Input
                  value={formData.bannerImageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, bannerImageUrl: e.target.value }))}
                  placeholder="https://example.com/banner.webp"
                />
                <p className="text-xs text-muted-foreground">You can paste a URL or upload a banner using the upload button above.</p>
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

              <div className="space-y-2">
                <Label>Service Cities</Label>
                <div className="flex gap-2">
                  <Select value={selectedServiceCityId} onValueChange={setSelectedServiceCityId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addServiceCity} disabled={!selectedServiceCityId}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.serviceAreaCityIds.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No service cities selected</span>
                  ) : (
                    formData.serviceAreaCityIds.map((cityId) => (
                      <Badge key={cityId} variant="secondary" className="gap-1">
                        {cityNameById.get(cityId) || cityId}
                        <button type="button" onClick={() => removeServiceCity(cityId)} aria-label={`Remove ${cityNameById.get(cityId) || cityId}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createProfile.isPending || uploadPhoto.isPending || uploadBanner.isPending || !formData.businessName}>
                {createProfile.isPending || uploadPhoto.isPending || uploadBanner.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </main>
      </FeatureFlagGate>
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
  const bannerViewUrl = profile.bannerImageUrl
    ? getMinioViewUrl(profile.bannerImageUrl) || profile.bannerImageUrl
    : null
  const serviceCityNames = (profile.serviceAreas || []).map((serviceArea) => ({
    id: serviceArea.id,
    cityId: serviceArea.cityId,
    name: serviceArea.city?.name || cityNameById.get(serviceArea.cityId) || serviceArea.cityId,
  }))
  const showPlainDescription = !!profile.description && !containsHtml(profile.description)

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
          {bannerViewUrl && (
            <div className="mb-6 h-40 w-full overflow-hidden rounded-2xl border bg-muted sm:h-52">
              <NextImage
                src={bannerViewUrl}
                alt={`${profile.businessName} banner`}
                width={1600}
                height={520}
                unoptimized={true}
                priority={true}
                className="h-full w-full object-cover"
              />
            </div>
          )}

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

              {showPlainDescription && (
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

              {serviceCityNames.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  {serviceCityNames.map((serviceCity) => (
                    <Badge key={serviceCity.id} variant="secondary">{serviceCity.name}</Badge>
                  ))}
                </div>
              )}
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
                <div className="space-y-6">
                  {featuredPortfolio && normalizedFeaturedMedia.length ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">Featured Album</h3>
                        <Badge variant="secondary">{featuredPortfolio.title}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                        {normalizedFeaturedMedia.slice(0, 4).map((media) => {
                          const mediaUrl = media.viewerUrl
                          const thumbnailUrl = media.viewerThumbnailUrl
                          return (
                            <div key={`featured-${media.id}`} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
                              {media.type === 'VIDEO' ? (
                                <>
                                  {thumbnailUrl ? (
                                    <NextImage
                                      src={thumbnailUrl}
                                      alt={media.altText || 'Featured portfolio video'}
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
                              ) : mediaUrl ? (
                                <NextImage
                                  src={mediaUrl}
                                  alt={media.altText || 'Featured portfolio image'}
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
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">All Pictures</h3>
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
                            ) : mediaUrl ? (
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
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
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

      <Dialog
        open={showManageDialog}
        onOpenChange={(open) => {
          setShowManageDialog(open)
          if (!open) {
            setManagePhotoFile(null)
            setManageBannerFile(null)
            setManagePhotoPreviewUrl((prev) => {
              if (prev.startsWith('blob:')) {
                URL.revokeObjectURL(prev)
              }
              return ''
            })
            setManageBannerPreviewUrl((prev) => {
              if (prev.startsWith('blob:')) {
                URL.revokeObjectURL(prev)
              }
              return ''
            })
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Profile</DialogTitle>
            <DialogDescription>Edit all profile fields shown in your profile page.</DialogDescription>
          </DialogHeader>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
          <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerUpload} className="hidden" />

          <div className="space-y-4 py-2">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold">Branding</p>
                <p className="text-xs text-muted-foreground">Control how your profile appears publicly.</p>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-[120px_1fr]">
                <div className="h-30 w-30 overflow-hidden rounded-full border bg-muted">
                  <NextImage
                    src={managePhotoPreviewUrl || profilePhotoViewUrl || '/images/placeholder-image.svg'}
                    alt="Profile image preview"
                    width={240}
                    height={240}
                    unoptimized={true}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-30 w-full overflow-hidden rounded-xl border bg-muted">
                  <NextImage
                    src={manageBannerPreviewUrl || bannerViewUrl || '/images/placeholder-image.svg'}
                    alt="Banner image preview"
                    width={1200}
                    height={320}
                    unoptimized={true}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending}>
                {uploadPhoto.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload / Change Photo
              </Button>
              {managePhotoFile ? <span className="text-xs text-muted-foreground">{managePhotoFile.name}</span> : null}
              {profile.profilePhotoUrl && (
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDeletePhoto} disabled={deletePhoto.isPending}>
                  {deletePhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => bannerInputRef.current?.click()} disabled={uploadBanner.isPending}>
                {uploadBanner.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload / Change Banner
              </Button>
              {manageBannerFile ? <span className="text-xs text-muted-foreground">{manageBannerFile.name}</span> : null}
              {profile.bannerImageUrl && (
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDeleteBanner} disabled={deleteBanner.isPending}>
                  {deleteBanner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold">Business Identity</p>
                <p className="text-xs text-muted-foreground">Manage your public business details and category.</p>
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
                <p className="text-xs text-muted-foreground">Used in your public profile URL.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.categoryId || undefined}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory && selectedCategory.isActive === false ? (
                    <SelectItem key={selectedCategory.id} value={selectedCategory.id}>
                      {selectedCategory.name} (inactive)
                    </SelectItem>
                  ) : null}
                  {activeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!categoriesLoading && activeCategories.length === 0 ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-dashed p-2">
                  <p className="text-xs text-muted-foreground">No categories available right now.</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => refetchCategories()}>
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={formData.tagline} onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Add a short tagline" />
              <p className="text-xs text-muted-foreground">Keep it concise and memorable.</p>
            </div>

            <div className="space-y-2">
              <Label>Banner Image URL</Label>
              <Input
                value={formData.bannerImageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, bannerImageUrl: e.target.value }))}
                placeholder="https://example.com/banner.webp"
              />
              <p className="text-xs text-muted-foreground">You can paste a URL or use Upload / Change Banner for direct image upload.</p>
            </div>
            </div>

            <Separator />

            <div className="rounded-xl border p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold">Contact & Coverage</p>
                <p className="text-xs text-muted-foreground">Set customer contact info and service area details.</p>
              </div>

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

            <div className="space-y-2">
              <Label>Service Cities</Label>
              <div className="flex gap-2">
                <Select value={selectedServiceCityId} onValueChange={setSelectedServiceCityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addServiceCity} disabled={!selectedServiceCityId}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.serviceAreaCityIds.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No service cities selected</span>
                ) : (
                  formData.serviceAreaCityIds.map((cityId) => (
                    <Badge key={cityId} variant="secondary" className="gap-1">
                      {cityNameById.get(cityId) || cityId}
                      <button type="button" onClick={() => removeServiceCity(cityId)} aria-label={`Remove ${cityNameById.get(cityId) || cityId}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateProfile.isPending || uploadPhoto.isPending || uploadBanner.isPending}>
              {updateProfile.isPending || uploadPhoto.isPending || uploadBanner.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageCropperDialog
        open={isCropDialogOpen}
        file={cropFile}
        title={cropTarget ? cropConfigByTarget[cropTarget].title : 'Crop Image'}
        description={cropTarget ? cropConfigByTarget[cropTarget].description : undefined}
        aspect={cropTarget ? cropConfigByTarget[cropTarget].aspect : 1}
        outputWidth={cropTarget ? cropConfigByTarget[cropTarget].outputWidth : 800}
        outputHeight={cropTarget ? cropConfigByTarget[cropTarget].outputHeight : 800}
        cropShape={cropTarget ? cropConfigByTarget[cropTarget].cropShape : 'rect'}
        onOpenChange={handleCropOpenChange}
        onConfirm={handleCropConfirm}
      />
    </main>
  )
}
