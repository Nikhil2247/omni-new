'use client'

import { SettingsShell } from '@/components/dash'
import { NotificationsForm } from '@/components/settings/notifications-form'

export default function OpsNotificationsPage() {
  return (
    <SettingsShell basePath="/ops/settings">
      <NotificationsForm />
    </SettingsShell>
  )
}
