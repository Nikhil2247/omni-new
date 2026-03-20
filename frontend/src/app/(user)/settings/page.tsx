'use client'

import { useEffect } from 'react'
import { Heart, User, Bell, Shield, CreditCard } from 'lucide-react'
import { SettingsCard } from '@/components/settings/settings-card'
import { trackDashboard } from '@/lib/analytics/umami'

export default function UserSettingsPage() {
  useEffect(() => {
    trackDashboard.sectionView('settings', 'user')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and personal information.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SettingsCard
          title="Wedding Identity"
          description="Manage your joint profile and invite your partner to collaborate."
          href="/settings/wedding-identity"
          icon={Heart}
          iconColor="text-pink-500"
        />

        <SettingsCard
          title="Profile"
          description="Update your personal information and account details."
          href="/settings/profile"
          icon={User}
          iconColor="text-blue-500"
        />

        <SettingsCard
          title="Notifications"
          description="Manage notification preferences and communication settings."
          href="/settings/notifications"
          icon={Bell}
          iconColor="text-amber-500"
        />

        <SettingsCard
          title="Security"
          description="Password, two-factor authentication, and session management."
          href="/settings/security"
          icon={Shield}
          iconColor="text-green-500"
        />

        <SettingsCard
          title="Subscription"
          description="Manage your plan, view usage, and billing information."
          href="/settings/subscription"
          icon={CreditCard}
          iconColor="text-purple-500"
        />
      </div>
    </div>
  )
}
