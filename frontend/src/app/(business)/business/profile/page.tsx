'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  useBusinessProfile,
  useCreateBusinessProfile,
  useUpdateBusinessProfile,
  useSubmitForVerification,
  useGenerateSlug,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
} from '@/hooks/queries/use-business'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Store,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  Save,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import type { VendorStatus } from '@/lib/api/types/business.types'

const statusConfig: Record<VendorStatus, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Edit },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertTriangle },
}

// Mock categories - in a real app, fetch from API
const CATEGORIES = [
  { id: 'cat-1', name: 'Photography' },
  { id: 'cat-2', name: 'Videography' },
  { id: 'cat-3', name: 'Catering' },
  { id: 'cat-4', name: 'Decoration' },
  { id: 'cat-5', name: 'Venue' },
  { id: 'cat-6', name: 'Music & Entertainment' },
  { id: 'cat-7', name: 'Florist' },
  { id: 'cat-8', name: 'Makeup & Hair' },
]

export default function BusinessProfilePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: profile, isLoading, error } = useBusinessProfile()
  const createProfile = useCreateBusinessProfile()
  const updateProfile = useUpdateBusinessProfile()
  const submitVerification = useSubmitForVerification()
  const generateSlug = useGenerateSlug()
  const uploadPhoto = useUploadProfilePhoto()
  const deletePhoto = useDeleteProfilePhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
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
    if (profile) {
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
    }
  }, [profile])

  const handleGenerateSlug = async () => {
    if (formData.businessName) {
      const result = await generateSlug.mutateAsync(formData.businessName)
      setFormData(prev => ({ ...prev, slug: result.slug }))
    }
  }

  const handleCreate = () => {
    createProfile.mutate(
      {
        businessName: formData.businessName,
        slug: formData.slug,
        categoryId: formData.categoryId,
        tagline: formData.tagline || undefined,
        description: formData.description || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        serviceRadius: formData.serviceRadius ? parseInt(formData.serviceRadius) : undefined,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false)
        },
      }
    )
  }

  const handleUpdate = () => {
    updateProfile.mutate(
      {
        businessName: formData.businessName,
        tagline: formData.tagline || undefined,
        description: formData.description || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        serviceRadius: formData.serviceRadius ? parseInt(formData.serviceRadius) : undefined,
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  const handleSubmitForVerification = () => {
    submitVerification.mutate()
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    uploadPhoto.mutate(file, {
      onSuccess: () => {
        toast.success('Profile photo uploaded successfully')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to upload photo')
      },
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = () => {
    deletePhoto.mutate(undefined, {
      onSuccess: () => {
        toast.success('Profile photo deleted')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete photo')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No profile exists - show create option
  if (error || !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground">Set up your vendor profile to start receiving agreements</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Create Your Business Profile</CardTitle>
            <CardDescription>
                Get started by creating your vendor profile. This will allow you to showcase your services and receive agreements.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" onClick={() => setShowCreateDialog(true)}>
              <Store className="mr-2 h-5 w-5" />
              Create Profile
            </Button>
          </CardContent>
        </Card>

        {/* Create Profile Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Business Profile</DialogTitle>
              <DialogDescription>
                Fill in your business details to create your vendor profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      placeholder="your-business-name"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateSlug}
                      disabled={!formData.businessName || generateSlug.isPending}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="A short tagline for your business"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your business and services..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@yourbusiness.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+1 234 567 8900"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourbusiness.com"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceRadius">Service Radius (miles)</Label>
                  <Input
                    id="serviceRadius"
                    type="number"
                    placeholder="50"
                    value={formData.serviceRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createProfile.isPending || !formData.businessName || !formData.slug || !formData.categoryId}
              >
                {createProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Profile'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const status = statusConfig[profile.status] || statusConfig.DRAFT
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground">Manage your vendor profile and business information</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
          {profile.verifiedAt && (
            <Badge className="bg-blue-100 text-blue-700">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Photo Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Upload a professional photo for your business profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Photo Preview */}
            <div className="relative">
              {profile.profilePhotoUrl ? (
                <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 relative">
                  <Image
                    src={profile.profilePhotoUrl}
                    alt={profile.businessName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">No photo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPhoto.isPending}
                >
                  {uploadPhoto.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {profile.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                    </>
                  )}
                </Button>
                {profile.profilePhotoUrl && (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDeletePhoto}
                    disabled={deletePhoto.isPending}
                  >
                    {deletePhoto.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 400x400px. Max size: 10MB. Formats: JPEG, PNG, WebP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profile Views</p>
                <p className="text-2xl font-bold">{profile.viewCount.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">{status.label}</p>
              </div>
              <StatusIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            {profile.status === 'DRAFT' && (
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={handleSubmitForVerification}
                disabled={submitVerification.isPending}
              >
                {submitVerification.isPending ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your business details visible to customers</CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input value={profile.slug} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="A short tagline"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Radius (miles)</Label>
                  <Input
                    type="number"
                    value={formData.serviceRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Store className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">{profile.businessName}</h3>
                </div>
                {profile.tagline && (
                  <p className="text-muted-foreground italic">{profile.tagline}</p>
                )}
              </div>

              {profile.description && (
                <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Contact Information</h4>
                  {profile.contactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${profile.contactEmail}`} className="text-primary hover:underline">
                        {profile.contactEmail}
                      </a>
                    </div>
                  )}
                  {profile.contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${profile.contactPhone}`} className="text-primary hover:underline">
                        {profile.contactPhone}
                      </a>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Service Area</h4>
                  {profile.serviceRadius && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.serviceRadius} miles service radius</span>
                    </div>
                  )}
                  {profile.category && (
                    <div>
                      <Badge variant="secondary">{profile.category.name}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
