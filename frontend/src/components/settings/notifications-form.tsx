'use client'

import { useState } from 'react'
import { useUpdateNotificationPreferences } from '@/hooks/use-user-settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function NotificationsForm() {
  const updatePreferences = useUpdateNotificationPreferences()
  const [preferences, setPreferences] = useState({
    email: {
      events: true,
      leads: true,
      tasks: true,
      updates: false,
      marketing: false,
    },
    push: {
      events: true,
      leads: true,
      tasks: true,
      updates: false,
    },
    sms: {
      events: false,
      leads: false,
      tasks: false,
    }
  })

  const handleSave = async () => {
    updatePreferences.mutate(preferences)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground">Manage how you receive notifications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose what notifications you want to receive via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-events">Event Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about event changes</p>
            </div>
            <Switch
              id="email-events"
              checked={preferences.email.events}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, events: checked }
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-leads">Lead Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about new leads and inquiries</p>
            </div>
            <Switch
              id="email-leads"
              checked={preferences.email.leads}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, leads: checked }
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-tasks">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified about assigned tasks</p>
            </div>
            <Switch
              id="email-tasks"
              checked={preferences.email.tasks}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, tasks: checked }
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-updates">Product Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about new features and updates</p>
            </div>
            <Switch
              id="email-updates"
              checked={preferences.email.updates}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, updates: checked }
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-marketing">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">Receive promotional emails and offers</p>
            </div>
            <Switch
              id="email-marketing"
              checked={preferences.email.marketing}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, marketing: checked }
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Manage in-app push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-events">Event Updates</Label>
              <p className="text-sm text-muted-foreground">Real-time event notifications</p>
            </div>
            <Switch
              id="push-events"
              checked={preferences.push.events}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  push: { ...preferences.push, events: checked }
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-leads">Lead Notifications</Label>
              <p className="text-sm text-muted-foreground">Instant lead alerts</p>
            </div>
            <Switch
              id="push-leads"
              checked={preferences.push.leads}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  push: { ...preferences.push, leads: checked }
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-tasks">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">Task deadline notifications</p>
            </div>
            <Switch
              id="push-tasks"
              checked={preferences.push.tasks}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  push: { ...preferences.push, tasks: checked }
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updatePreferences.isPending}>
          {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
