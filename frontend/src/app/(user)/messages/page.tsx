'use client'

import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'

export default function UserMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">Continue conversations with vendors and planners.</p>
      </div>
      <MessagingWorkspace scope="user" />
    </div>
  )
}
