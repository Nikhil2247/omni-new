'use client'

import { SettingsShell } from '@/components/dash'
import { SecurityForm } from '@/components/settings/security-form'

export default function OpsSecurityPage() {
  return (
    <SettingsShell basePath="/ops/settings">
      <SecurityForm />
    </SettingsShell>
  )
}
