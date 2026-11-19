'use client'

import { SettingsShell } from '@/components/dash'
import { NotificationsForm } from '@/components/settings/notifications-form'

export default function MarketingNotificationsPage() {
  return (
    <SettingsShell basePath="/marketing/settings">
      <NotificationsForm />
    </SettingsShell>
  )
}
