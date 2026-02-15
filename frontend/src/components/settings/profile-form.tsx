'use client'

import { useState, useEffect } from 'react'
import { useUserProfile } from '@/hooks/queries/use-user-profile'
import { useUpdateProfile } from '@/hooks/use-user-settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Phone, Shield, CheckCircle2, XCircle, Edit2, Save, X } from 'lucide-react'

interface ProfileFormProps {
  rolePrefix?: string
}

export function ProfileForm({ rolePrefix = '' }: ProfileFormProps) {
  const { data, isLoading, error } = useUserProfile()
  const updateProfile = useUpdateProfile()
  const roleValue = data?.role || data?.roles?.[0] || 'USER'
  const formattedRole = roleValue
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Initialize form data when profile loads
  useEffect(() => {
    if (data) {
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
      })
    }
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    updateProfile.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    }, {
      onSuccess: () => {
        setIsEditing(false)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-100 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Unable to load profile information</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-base text-muted-foreground">
          Manage your personal information and account details
        </p>
      </div>

      {/* Main Profile Card */}
      <Card className="border-muted shadow-sm">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
              <CardDescription className="text-sm">
                Update your profile details and contact information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* First Name */}
              <div className="space-y-3">
                <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted/50 border-muted' : 'border-input focus:border-primary'}
                  placeholder="Enter your first name"
                />
              </div>
              
              {/* Last Name */}
              <div className="space-y-3">
                <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted/50 border-muted' : 'border-input focus:border-primary'}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted/50 border-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Email address cannot be changed for security reasons
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="+1 (555) 000-0000"
                className={!isEditing ? 'bg-muted/50 border-muted' : 'border-input focus:border-primary'}
              />
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={updateProfile.isPending}
                  className="min-w-30 gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      firstName: data.firstName || '',
                      lastName: data.lastName || '',
                      email: data.email || '',
                      phone: data.phone || '',
                    })
                  }}
                  disabled={updateProfile.isPending}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card className="border-muted shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Role</p>
                <p className="text-xs text-muted-foreground">Your account access level</p>
              </div>
              <Badge variant="secondary" className="font-medium">
                {formattedRole}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Email Verification</p>
                <p className="text-xs text-muted-foreground">Email address verification status</p>
              </div>
              {data.emailVerified ? (
                <Badge variant="default" className="gap-1.5 bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-600">
                  <XCircle className="h-3.5 w-3.5" />
                  Not Verified
                </Badge>
              )}
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Extra layer of account security</p>
              </div>
              {data.twoFactorEnabled ? (
                <Badge variant="default" className="gap-1.5 bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                  <XCircle className="h-3.5 w-3.5" />
                  Disabled
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
