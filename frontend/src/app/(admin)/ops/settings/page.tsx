'use client'

import { useEffect } from 'react'
import { SettingsShell } from '@/components/dash'
import { ProfileForm } from '@/components/settings/profile-form'
import { useUmami } from '@/hooks/use-umami'

export default function OpsSettingsPage() {
  const { track } = useUmami()

  useEffect(() => {
    track('ops:settings:page_view', { section: 'settings_overview' })
  }, [track])

  return (
    <SettingsShell basePath="/ops/settings">
      <ProfileForm />
    </SettingsShell>
  )
}
