'use client'

import { SettingsShell } from '@/components/dash'
import { NotificationsForm } from '@/components/settings/notifications-form'

export default function SalesNotificationsPage() {
  return (
    <SettingsShell basePath="/sales/settings">
      <NotificationsForm />
    </SettingsShell>
  )
}
