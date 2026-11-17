'use client'

import { useEffect } from 'react'
import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'
import { Brush, Eyebrow } from '@/components/sketch'
import { trackDashboard } from '@/lib/analytics/umami'

export default function UserMessagesPage() {
  useEffect(() => {
    trackDashboard.sectionView('messages', 'user')
  }, [])

  return (
    <div className="space-y-4">
      <header>
        <Eyebrow>Inbox</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Your <Brush>messages</Brush>
        </h1>
        <p className="text-ink-soft mt-3">Continue conversations with vendors and planners.</p>
      </header>
      <MessagingWorkspace scope="user" />
    </div>
  )
}
