'use client'

import { SettingsShell } from '@/components/dash'
import { NotificationsForm } from '@/components/settings/notifications-form'

export default function AdminNotificationsPage() {
  return (
    <SettingsShell basePath="/admin/settings">
      <NotificationsForm />
    </SettingsShell>
  )
}
