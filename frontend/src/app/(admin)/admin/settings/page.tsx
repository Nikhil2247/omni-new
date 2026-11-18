'use client'

import { useEffect } from 'react'
import { User, Bell, Shield } from 'lucide-react'
import { SettingsCard } from '@/components/settings/settings-card'
import { useUmami } from '@/hooks/use-umami'
import { PageHeader } from '@/components/dashboard'

export default function AdminSettingsPage() {
  const { track } = useUmami()

  useEffect(() => {
    track('admin:settings:page_view', { section: 'settings_overview' })
  }, [track])

  return (
    <div className="space-y-3">
      <PageHeader title="Settings" />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
