'use client'

import { PageHeader } from '@/components/dashboard'
import { User, Bell, Shield } from 'lucide-react'
import { SettingsCard } from '@/components/settings/settings-card'

export default function OpsSettingsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Settings" />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <SettingsCard
          title="Profile"
          description="Update your personal details and account information."
          href="/ops/settings/profile"
          icon={User}
          iconColor="text-blue-500"
        />
        
        <SettingsCard
          title="Notifications"
          description="Manage notification preferences for operations alerts."
          href="/ops/settings/notifications"
          icon={Bell}
          iconColor="text-amber-500"
        />
        
        <SettingsCard
          title="Security"
          description="Manage sessions, password, and two-factor authentication."
          href="/ops/settings/security"
          icon={Shield}
          iconColor="text-green-500"
        />
      </div>
    </div>
  )
}
