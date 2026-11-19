'use client'

import { SettingsShell } from '@/components/dash'
import { ProfileForm } from '@/components/settings/profile-form'

export default function SalesProfilePage() {
  return (
    <SettingsShell basePath="/sales/settings">
      <ProfileForm />
    </SettingsShell>
  )
}
