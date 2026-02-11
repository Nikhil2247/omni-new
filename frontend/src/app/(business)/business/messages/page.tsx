'use client'

import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'

export default function BusinessMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat with planners and manage inquiries in real time.</p>
      </div>
      <MessagingWorkspace scope="business" />
    </div>
  )
}
