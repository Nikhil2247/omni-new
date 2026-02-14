'use client'

import { MessagingWorkspace } from '@/components/features/messaging/messaging-workspace'

export default function UserMessagesPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="h-full flex flex-col rounded-lg overflow-hidden">
        <MessagingWorkspace scope="user" />
      </div>
    </div>
  )
}
