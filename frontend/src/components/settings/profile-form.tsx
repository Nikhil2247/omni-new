'use client'

import { useState, useEffect } from 'react'
import { useUserProfile } from '@/hooks/queries/use-user-profile'
import { useUpdateProfile, useChangePassword, useSetPassword } from '@/hooks/use-user-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  StatusBadge,
  SettingsSection,
  SettingRow,
  SettingsBlock,
  SettingsSaveBar,
  SettingsStandaloneTitle,
} from '@/components/dash'
import { Camera, Eye, EyeOff, Lock, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileFormProps {
  rolePrefix?: string
}

export function ProfileForm({ rolePrefix = '' }: ProfileFormProps) {
  const { data, isLoading, error } = useUserProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const setPassword = useSetPassword()

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

  const resetForm = () => {
    if (data) {
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
      })
    }
  }

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

  const dirty =
    !!data &&
    (formData.firstName !== (data.firstName || '') ||
      formData.lastName !== (data.lastName || '') ||
      formData.phone !== (data.phone || ''))

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    updateProfile.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
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

    if (strength <= 1) return { label: 'Weak', width: '20%' }
    if (strength <= 2) return { label: 'Fair', width: '40%' }
    if (strength <= 3) return { label: 'Good', width: '60%' }
    if (strength <= 4) return { label: 'Strong', width: '80%' }
    return { label: 'Very Strong', width: '100%' }
  }

  const passwordStrength = getPasswordStrength(passwordForm.newPassword)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="border-destructive/40 bg-card flex items-center gap-3 rounded-xl border p-4">
        <XCircle className="text-destructive size-5" aria-hidden />
        <p className="text-destructive text-sm font-medium">Unable to load profile information</p>
      </div>
    )
  }

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ') || 'User'

  return (
    <div className="space-y-4">
      <SettingsStandaloneTitle title="Profile" description="Your personal details and account information." />

      <SettingsSection title="Profile" description="Your photo, name and contact details.">
        <SettingsBlock>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarImage src={data.avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitials(data.firstName, data.lastName)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                aria-label="Change photo"
                className="bg-primary text-primary-foreground focus-visible:ring-ring/50 absolute -right-1 -bottom-1 rounded-full p-1.5 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => toast.info('Avatar upload coming soon')}
              >
                <Camera className="size-3.5" aria-hidden />
              </button>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{fullName}</p>
              <p className="text-muted-foreground truncate text-sm">{data.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusBadge tone="muted">{formattedRole}</StatusBadge>
                <StatusBadge tone={data.emailVerified ? 'success' : 'warning'}>
                  {data.emailVerified ? 'Verified' : 'Not verified'}
                </StatusBadge>
              </div>
            </div>
          </div>
        </SettingsBlock>

        <form onSubmit={handleSubmit} id={`profile-form${rolePrefix ? `-${rolePrefix}` : ''}`}>
          <SettingRow label="First name" htmlFor="firstName" stacked>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Enter your first name"
            />
          </SettingRow>
          <div className="border-border/60 border-t" />
          <SettingRow label="Last name" htmlFor="lastName" stacked>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Enter your last name"
            />
          </SettingRow>
          <div className="border-border/60 border-t" />
          <SettingRow label="Email" htmlFor="email" description="Email cannot be changed for security." stacked>
            <Input id="email" type="email" value={formData.email} disabled className="bg-muted/50" />
          </SettingRow>
          <div className="border-border/60 border-t" />
          <SettingRow label="Phone" htmlFor="phone" stacked>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </SettingRow>
        </form>
      </SettingsSection>

      <SettingsSection title="Sign-in" description="How you access your account.">
        <SettingRow
          label="Password"
          description={
            isGoogleUser && !hasPassword
              ? 'You signed up with Google. Add a password to also sign in with your email.'
              : hasPassword
                ? 'Last changed recently'
                : 'No password set'
          }
        >
          <Button type="button" variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
            {hasPassword ? 'Change' : 'Set password'}
          </Button>
        </SettingRow>
        <SettingRow label="Two-factor authentication" description="Extra security for your account">
          <StatusBadge tone={data.twoFactorEnabled ? 'success' : 'muted'}>
            {data.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </StatusBadge>
        </SettingRow>
        {isGoogleUser ? (
          <SettingRow label="Connected account" description="Signed in with Google">
            <StatusBadge tone="muted">Google</StatusBadge>
          </SettingRow>
        ) : null}
        <SettingRow label="Account type" description="Your access level">
          <StatusBadge tone="muted">{formattedRole}</StatusBadge>
        </SettingRow>
      </SettingsSection>

      <SettingsSaveBar
        dirty={dirty}
        saving={updateProfile.isPending}
        onSave={() => handleSubmit()}
        onReset={resetForm}
      />

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
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
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
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
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
                        className="bg-primary h-full transition-all duration-300"
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
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
