'use client'

import { SettingsShell } from '@/components/dash'
import { SecurityForm } from '@/components/settings/security-form'

export default function MarketingSecurityPage() {
  return (
    <SettingsShell basePath="/marketing/settings">
      <SecurityForm />
    </SettingsShell>
  )
}
