'use client'

import { useEffect } from 'react'
import { User, Bell, Shield, Lock } from 'lucide-react'
import { SettingsCard } from '@/components/settings/settings-card'
import { useUmami } from '@/hooks/use-umami'

export default function AdminSettingsPage() {
  const { track } = useUmami()

  useEffect(() => {
    track('admin:settings:page_view', { section: 'settings_overview' })
  }, [track])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SettingsCard
          title="Profile"
          description="Update your personal details and account information."
          href="/admin/settings/profile"
          icon={User}
          iconColor="text-blue-500"
        />
        
        <SettingsCard
          title="Notifications"
          description="Manage notification preferences for admin alerts."
          href="/admin/settings/notifications"
          icon={Bell}
          iconColor="text-amber-500"
        />
        
        <SettingsCard
          title="Security"
          description="Manage sessions, password, and two-factor authentication."
          href="/admin/settings/security"
          icon={Shield}
          iconColor="text-green-500"
        />
      </div>
    </div>
  )
}
