'use client'

import { useEffect } from 'react'
import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'
import { trackDashboard } from '@/lib/analytics/umami'

export default function UserMessagesPage() {
  useEffect(() => {
    trackDashboard.sectionView('messages', 'user')
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">Continue conversations with vendors and planners.</p>
      </div>
      <MessagingWorkspace scope="user" />
    </div>
  )
}
