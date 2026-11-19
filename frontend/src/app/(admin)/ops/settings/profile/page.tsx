'use client'

import { SettingsShell } from '@/components/dash'
import { ProfileForm } from '@/components/settings/profile-form'

export default function OpsProfilePage() {
  return (
    <SettingsShell basePath="/ops/settings">
      <ProfileForm />
    </SettingsShell>
  )
}
