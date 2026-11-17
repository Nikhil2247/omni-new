'use client'

import { useEffect } from 'react'
import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'
import { SkContainer } from '@/components/sketch'
import { trackDashboard } from '@/lib/analytics/umami'

export default function UserMessagesPage() {
  useEffect(() => {
    trackDashboard.sectionView('messages', 'user')
  }, [])

  return (
    <SkContainer className="py-4 sm:py-6">
      <MessagingWorkspace scope="user" />
    </SkContainer>
  )
}
