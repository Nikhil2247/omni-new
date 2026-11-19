'use client'

import { useEffect } from 'react'
import { SettingsShell } from '@/components/dash'
import { ProfileForm } from '@/components/settings/profile-form'
import { useUmami } from '@/hooks/use-umami'

export default function AdminSettingsPage() {
  const { track } = useUmami()

  useEffect(() => {
    track('admin:settings:page_view', { section: 'settings_overview' })
  }, [track])

  return (
    <SettingsShell basePath="/admin/settings">
      <ProfileForm />
    </SettingsShell>
  )
}
