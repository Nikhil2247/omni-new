'use client'

import { useState, useEffect } from 'react'
import { useUserProfile } from '@/hooks/queries/use-user-profile'
import { useUpdateProfile, useChangePassword, useSetPassword } from '@/hooks/use-user-settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X,
  Camera,
  Key,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface ProfileFormProps {
  rolePrefix?: string
}

export function ProfileForm({ rolePrefix = '' }: ProfileFormProps) {
  const { data, isLoading, error } = useUserProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const setPassword = useSetPassword()

  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const roleValue = data?.role || data?.roles?.[0] || 'USER'
  const formattedRole = roleValue
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  const hasPassword = data?.hasPassword !== false
  const isGoogleUser = data?.authProvider === 'google'

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (hasPassword) {
      changePassword.mutate({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, {
        onSuccess: () => {
          setShowPasswordDialog(false)
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        },
      })
    } else {
      setPassword.mutate({
        newPassword: passwordForm.newPassword,
      }, {
        onSuccess: () => {
          setShowPasswordDialog(false)
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        },
      })
    }
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return first + last || 'U'
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

    if (strength <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' }
    if (strength <= 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' }
    if (strength <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' }
    if (strength <= 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' }
    return { label: 'Very Strong', color: 'bg-green-600', width: '100%' }
  }

  const passwordStrength = getPasswordStrength(passwordForm.newPassword)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
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

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || 'User'
  const memberSince = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <Card className="border-muted shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={data.avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                  {getInitials(data.firstName, data.lastName)}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => toast.info('Avatar upload coming soon')}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Name and Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
                {data.emailVerified && (
                  <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {data.email}
                </span>
                {memberSince && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {memberSince}
                  </span>
                )}
              </div>
            </div>

            {/* Role Badge */}
            <Badge variant="outline" className="font-medium">
              {formattedRole}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Google Account Notice */}
      {isGoogleUser && !hasPassword && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            You signed up with Google. Add a password to also login with your email and password.
            <Button
              variant="link"
              className="p-0 h-auto ml-1 text-blue-600 dark:text-blue-400"
              onClick={() => setShowPasswordDialog(true)}
            >
              Set password now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Personal Information - Takes 2 columns on large screens */}
        <Card className="border-muted shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
                <CardDescription className="text-sm">
                  Your personal details and contact information
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
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    Email cannot be changed for security
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="gap-2"
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
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First Name</p>
                    <p className="text-sm font-medium">{data.firstName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Name</p>
                    <p className="text-sm font-medium">{data.lastName || '—'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {data.email}
                    {data.emailVerified && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                  <p className="text-sm font-medium">{data.phone || '—'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Account Status - Single column */}
        <div className="space-y-6">
          {/* Password & Security */}
          <Card className="border-muted shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-muted-foreground" />
                Password & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">
                    {hasPassword ? 'Last changed recently' : 'No password set'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  {hasPassword ? 'Change' : 'Set Password'}
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Extra security for your account</p>
                </div>
                {data.twoFactorEnabled ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Disabled
                  </Badge>
                )}
              </div>

              {isGoogleUser && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Connected Account</p>
                      <p className="text-xs text-muted-foreground">Signed in with Google</p>
                    </div>
                    <Badge variant="secondary" className="gap-1.5">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="border-muted shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Account Type</p>
                  <p className="text-xs text-muted-foreground">Your access level</p>
                </div>
                <Badge variant="secondary" className="font-medium">
                  {formattedRole}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Email Verification</p>
                  <p className="text-xs text-muted-foreground">Account verification status</p>
                </div>
                {data.emailVerified ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {hasPassword ? 'Change Password' : 'Set Password'}
            </DialogTitle>
            <DialogDescription>
              {hasPassword
                ? 'Enter your current password and choose a new one.'
                : 'Create a password to login with your email address.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.newPassword && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground min-w-16">
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use 8+ characters with uppercase, lowercase, numbers & symbols
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false)
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePassword.isPending || setPassword.isPending}
              >
                {(changePassword.isPending || setPassword.isPending)
                  ? 'Saving...'
                  : hasPassword ? 'Change Password' : 'Set Password'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
