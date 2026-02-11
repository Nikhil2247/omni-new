'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export default function UserNotificationSettingsPage() {
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [smsUpdates, setSmsUpdates] = useState(false)
  const [eventReminders, setEventReminders] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground">Choose how you want to hear from us.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email updates</p>
              <p className="text-muted-foreground">Product updates and quote status.</p>
            </div>
            <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS updates</p>
              <p className="text-muted-foreground">Time-sensitive reminders.</p>
            </div>
            <Switch checked={smsUpdates} onCheckedChange={setSmsUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Event reminders</p>
              <p className="text-muted-foreground">Timeline and task reminders.</p>
            </div>
            <Switch checked={eventReminders} onCheckedChange={setEventReminders} />
          </div>
          <p className="text-xs text-muted-foreground">Preferences will sync when notification APIs are enabled.</p>
        </CardContent>
      </Card>
    </div>
  )
}
