'use client'

import { User, Bell, Shield } from 'lucide-react'
import { SettingsCard } from '@/components/settings/settings-card'

export default function MarketingSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your marketing account preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SettingsCard
          title="Profile"
          description="Update your personal details and account information."
          href="/marketing/settings/profile"
          icon={User}
          iconColor="text-blue-500"
        />
        
        <SettingsCard
          title="Notifications"
          description="Manage notification preferences for marketing updates."
          href="/marketing/settings/notifications"
          icon={Bell}
          iconColor="text-amber-500"
        />
        
        <SettingsCard
          title="Security"
          description="Manage sessions, password, and two-factor authentication."
          href="/marketing/settings/security"
          icon={Shield}
          iconColor="text-green-500"
        />
      </div>
    </div>
  )
}
