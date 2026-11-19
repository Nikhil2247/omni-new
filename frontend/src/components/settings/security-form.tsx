'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { useLogout } from '@/hooks/use-auth'
import { useChangePassword, useEnable2FA, useVerify2FA, useDisable2FA } from '@/hooks/use-user-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  StatusBadge,
  SettingsSection,
  SettingRow,
  SettingsBlock,
  DangerZone,
  SettingsStandaloneTitle,
} from '@/components/dash'
import { toast } from 'sonner'

export function SecurityForm() {
  const logout = useLogout()
  const changePassword = useChangePassword()
  const enable2FA = useEnable2FA()
  const verify2FA = useVerify2FA()
  const disable2FA = useDisable2FA()

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }, {
      onSuccess: () => {
        setShowPasswordForm(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      },
    })
  }

  const handleEnable2FA = async () => {
    enable2FA.mutate(undefined, {
      onSuccess: (data) => {
        setQrCode(data.qrCode)
        setShowTwoFactorSetup(true)
        toast.success('Two-factor authentication setup initiated')
      },
    })
  }

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    verify2FA.mutate({ code: verificationCode }, {
      onSuccess: () => {
        setTwoFactorEnabled(true)
        setShowTwoFactorSetup(false)
        setVerificationCode('')
      },
    })
  }

  const handleDisable2FA = async () => {
    disable2FA.mutate(undefined, {
      onSuccess: () => {
        setTwoFactorEnabled(false)
      },
    })
  }

  return (
    <div className="space-y-4">
      <SettingsStandaloneTitle title="Security" description="Manage your account security settings." />

      <SettingsSection title="Password" description="Change your account password.">
        {showPasswordForm ? (
          <SettingsBlock>
            <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  disabled={changePassword.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </SettingsBlock>
        ) : (
          <SettingRow label="Password" description="Use a strong password you do not use elsewhere.">
            <Button size="sm" variant="outline" onClick={() => setShowPasswordForm(true)}>
              Change password
            </Button>
          </SettingRow>
        )}
      </SettingsSection>

      <SettingsSection
        title="Two-factor authentication"
        description="Add an extra layer of security to your account."
      >
        <SettingRow
          label="2FA status"
          htmlFor="two-factor-switch"
          description={
            twoFactorEnabled
              ? 'Your account is protected. You will need your authenticator app to sign in.'
              : 'Require a code from an authenticator app when signing in.'
          }
        >
          <div className="flex items-center gap-3">
            <StatusBadge tone={twoFactorEnabled ? 'success' : 'muted'}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </StatusBadge>
            <Switch
              id="two-factor-switch"
              checked={twoFactorEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleEnable2FA()
                } else {
                  handleDisable2FA()
                }
              }}
            />
          </div>
        </SettingRow>

        {showTwoFactorSetup && (
          <SettingsBlock className="space-y-4">
            <h3 className="text-sm font-medium">Set up two-factor authentication</h3>
            <ol className="space-y-1.5 text-sm text-muted-foreground">
              <li>1. Download an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>2. Scan the QR code below with your authenticator app</li>
              <li>3. Enter the 6-digit code to complete setup</li>
            </ol>

            {/* TODO: Display QR code from API response */}
            <div className="flex h-48 items-center justify-center rounded-lg border bg-muted/40">
              {qrCode ? (
                <NextImage
                  src={qrCode}
                  alt="2FA QR Code"
                  width={192}
                  height={192}
                  unoptimized={true}
                  priority={true}
                  className="h-full w-auto"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Loading QR code...</p>
              )}
            </div>

            <div className="max-w-xs space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>

            <Button onClick={handleVerify2FA} disabled={verify2FA.isPending}>
              {verify2FA.isPending ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </SettingsBlock>
        )}
      </SettingsSection>

      <DangerZone title="Sessions" description="Sign out if you are on a shared device or want to log out remotely.">
        <SettingRow label="Sign out of this session" description="You will need to sign in again to continue.">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Signing out...' : 'Sign out'}
          </Button>
        </SettingRow>
      </DangerZone>
    </div>
  )
}
