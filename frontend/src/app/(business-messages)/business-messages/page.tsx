'use client'

import { useEffect } from 'react'
import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'
import { trackDashboard } from '@/lib/analytics/umami'

export default function BusinessMessagesPage() {
  useEffect(() => {
    trackDashboard.sectionView('messages', 'vendor')
  }, [])

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] p-2">
      <div className="h-full flex flex-col rounded-lg overflow-hidden">
        <MessagingWorkspace scope="business" />
      </div>
    </div>
  )
}
