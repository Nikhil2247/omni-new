'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { useLogout } from '@/hooks/use-auth'
import { useChangePassword, useEnable2FA, useVerify2FA, useDisable2FA } from '@/hooks/use-user-settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Key, Smartphone, AlertTriangle } from 'lucide-react'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-muted-foreground">Manage your account security settings.</p>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
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
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>2FA Status</Label>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <Switch
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

          {twoFactorEnabled && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your account is protected with two-factor authentication. You'll need your
                authenticator app to sign in.
              </AlertDescription>
            </Alert>
          )}

          {showTwoFactorSetup && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Setup Two-Factor Authentication</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>2. Scan the QR code below with your authenticator app</li>
                <li>3. Enter the 6-digit code to complete setup</li>
              </ol>
              
              {/* TODO: Display QR code from API response */}
              <div className="flex h-48 items-center justify-center rounded-lg border bg-muted">
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

              <div className="space-y-2">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>Manage your active sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign out of this session if you're on a shared device or want to log out remotely.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Signing out...' : 'Sign out of this session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
