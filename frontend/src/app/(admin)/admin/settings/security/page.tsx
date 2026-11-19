'use client'

import { SettingsShell } from '@/components/dash'
import { SecurityForm } from '@/components/settings/security-form'

export default function AdminSecurityPage() {
  return (
    <SettingsShell basePath="/admin/settings">
      <SecurityForm />
    </SettingsShell>
  )
}
