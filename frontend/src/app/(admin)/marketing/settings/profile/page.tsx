'use client'

import { SettingsShell } from '@/components/dash'
import { ProfileForm } from '@/components/settings/profile-form'

export default function MarketingProfilePage() {
  return (
    <SettingsShell basePath="/marketing/settings">
      <ProfileForm />
    </SettingsShell>
  )
}
