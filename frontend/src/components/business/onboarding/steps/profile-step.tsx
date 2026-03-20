'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useOnboarding } from '../onboarding-context'
import { useUpdateBusinessProfile, useVendorCategories } from '@/hooks/queries/use-business'
import { toast } from 'sonner'

interface ProfileStepProps {
  onComplete: () => void
}

export function ProfileStep({ onComplete }: ProfileStepProps) {
  const { profile, hasCompleteProfile } = useOnboarding()
  const { data: categories, isLoading: isLoadingCategories } = useVendorCategories()
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateBusinessProfile()

  const [formData, setFormData] = useState({
    businessName: '',
    categoryId: '',
    tagline: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
  })

  // Initialize form with existing data
  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || '',
        categoryId: profile.categoryId || '',
        tagline: profile.tagline || '',
        description: profile.description || '',
        contactPhone: profile.contactPhone || '',
        contactEmail: profile.contactEmail || '',
        website: profile.website || '',
      })
    }
  }, [profile])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.businessName?.trim()) return 'Business name is required'
    if (!formData.categoryId) return 'Please select a category'
    if (!formData.description?.trim()) return 'Description is required'
    if (formData.description.length < 50) return 'Description should be at least 50 characters'
    return null
  }

  const handleSubmit = () => {
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    updateProfile(formData, {
      onSuccess: () => {
        toast.success('Profile updated successfully!')
        onComplete()
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update profile')
      },
    })
  }

  if (hasCompleteProfile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="font-semibold mb-2">Profile Complete!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your business profile is set up. You can always update it later from settings.
          </p>
          <Button onClick={onComplete}>Continue to Next Step</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Business Profile</CardTitle>
        </div>
        <CardDescription>
          Tell us about your business. This information will be visible to potential clients.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="Enter your business name"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => handleChange('categoryId', value)}
            disabled={isLoadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your business category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="A short catchy phrase for your business"
            value={formData.tagline}
            onChange={(e) => handleChange('tagline', e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {formData.tagline.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe your business, services, and what makes you unique..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            {formData.description.length} characters (minimum 50 required)
          </p>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="business@example.com"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
            />
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://www.yourwebsite.com"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can add photos, portfolio items, and services after completing the basic setup.
          </AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter>
        <Button onClick={handleSubmit} disabled={isUpdating} className="w-full">
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Continue'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
