'use client'

import { SettingsShell } from '@/components/dash'
import { SecurityForm } from '@/components/settings/security-form'

export default function SalesSecurityPage() {
  return (
    <SettingsShell basePath="/sales/settings">
      <SecurityForm />
    </SettingsShell>
  )
}
