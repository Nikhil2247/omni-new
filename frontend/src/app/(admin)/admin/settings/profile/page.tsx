'use client'

import { SettingsShell } from '@/components/dash'
import { ProfileForm } from '@/components/settings/profile-form'

export default function AdminProfilePage() {
  return (
    <SettingsShell basePath="/admin/settings">
      <ProfileForm />
    </SettingsShell>
  )
}
