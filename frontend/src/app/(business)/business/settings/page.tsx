'use client'

import { useEffect } from 'react'
import { User, Bell, Shield, CreditCard } from 'lucide-react'
import { SettingsCard } from '@/components/settings/settings-card'
import { useUmami } from '@/hooks/use-umami'

export default function BusinessSettingsPage() {
  const { track } = useUmami()

  useEffect(() => {
    track('business:settings:page_view', { section: 'settings_overview' })
  }, [track])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your business account preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SettingsCard
          title="Profile"
          description="Update your personal details and account information."
          href="/business/settings/profile"
          icon={User}
          iconColor="text-blue-500"
        />
        
        <SettingsCard
          title="Notifications"
          description="Manage notification preferences for business updates."
          href="/business/settings/notifications"
          icon={Bell}
          iconColor="text-amber-500"
        />
        
        <SettingsCard
          title="Security"
          description="Manage sessions, password, and two-factor authentication."
          href="/business/settings/security"
          icon={Shield}
          iconColor="text-green-500"
        />

        <SettingsCard
          title="Subscription"
          description="Manage your plan, ad credits, usage, and billing."
          href="/business/settings/subscription"
          icon={CreditCard}
          iconColor="text-purple-500"
        />
      </div>
    </div>
  )
}
