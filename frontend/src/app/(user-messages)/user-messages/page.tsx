'use client'

import { useEffect } from 'react'
import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'
import { trackDashboard } from '@/lib/analytics/umami'

export default function UserMessagesPage() {
  useEffect(() => {
    trackDashboard.sectionView('messages', 'user')
  }, [])

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] p-4 sm:p-4 lg:p-4">
      <div className="h-full flex flex-col rounded-lg overflow-hidden">
        <MessagingWorkspace scope="user" />
      </div>
    </div>
  )
}
