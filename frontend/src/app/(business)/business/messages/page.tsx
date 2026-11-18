'use client'

import { useEffect } from 'react'
import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'
import { PageHeader } from '@/components/dashboard'
import { trackDashboard } from '@/lib/analytics/umami'

export default function BusinessMessagesPage() {
  useEffect(() => {
    trackDashboard.sectionView('messages', 'vendor')
  }, [])

  return (
    <div className="space-y-3">
      <PageHeader title="Messages" />
      <MessagingWorkspace scope="business" />
    </div>
  )
}
