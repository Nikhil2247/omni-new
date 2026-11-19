'use client'

import { useState } from 'react'
import { useUpdateNotificationPreferences } from '@/hooks/use-user-settings'
import { Switch } from '@/components/ui/switch'
import { SettingsSection, SettingRow, SettingsSaveBar, SettingsStandaloneTitle } from '@/components/dash'

const INITIAL_PREFERENCES = {
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
  },
}

type Preferences = typeof INITIAL_PREFERENCES
type Channel = 'email' | 'push'

const EMAIL_ROWS: { key: keyof Preferences['email']; label: string; hint: string }[] = [
  { key: 'events', label: 'Event updates', hint: 'Get notified about event changes' },
  { key: 'leads', label: 'Lead notifications', hint: 'Get notified about new leads and inquiries' },
  { key: 'tasks', label: 'Task reminders', hint: 'Get notified about assigned tasks' },
  { key: 'updates', label: 'Product updates', hint: 'Get notified about new features and updates' },
  { key: 'marketing', label: 'Marketing emails', hint: 'Receive promotional emails and offers' },
]

const PUSH_ROWS: { key: keyof Preferences['push']; label: string; hint: string }[] = [
  { key: 'events', label: 'Event updates', hint: 'Real-time event notifications' },
  { key: 'leads', label: 'Lead notifications', hint: 'Instant lead alerts' },
  { key: 'tasks', label: 'Task reminders', hint: 'Task deadline notifications' },
]

export function NotificationsForm() {
  const updatePreferences = useUpdateNotificationPreferences()
  const [preferences, setPreferences] = useState<Preferences>(INITIAL_PREFERENCES)
  const [saved, setSaved] = useState<Preferences>(INITIAL_PREFERENCES)

  const dirty = JSON.stringify(preferences) !== JSON.stringify(saved)

  const handleSave = async () => {
    const snapshot = preferences
    updatePreferences.mutate(snapshot, {
      onSuccess: () => setSaved(snapshot),
    })
  }

  const toggle = (channel: Channel, key: string, checked: boolean) =>
    setPreferences({
      ...preferences,
      [channel]: { ...preferences[channel], [key]: checked },
    })

  return (
    <div className="space-y-4">
      <SettingsStandaloneTitle title="Notifications" description="Manage how you receive notifications." />

      <SettingsSection title="Email" description="Choose what you want to receive by email.">
        {EMAIL_ROWS.map((row) => (
          <SettingRow key={row.key} label={row.label} description={row.hint} htmlFor={`email-${row.key}`}>
            <Switch
              id={`email-${row.key}`}
              checked={preferences.email[row.key]}
              onCheckedChange={(checked) => toggle('email', row.key, checked)}
            />
          </SettingRow>
        ))}
      </SettingsSection>

      <SettingsSection title="Push" description="In-app push notifications.">
        {PUSH_ROWS.map((row) => (
          <SettingRow key={row.key} label={row.label} description={row.hint} htmlFor={`push-${row.key}`}>
            <Switch
              id={`push-${row.key}`}
              checked={preferences.push[row.key]}
              onCheckedChange={(checked) => toggle('push', row.key, checked)}
            />
          </SettingRow>
        ))}
      </SettingsSection>

      <SettingsSaveBar
        dirty={dirty}
        saving={updatePreferences.isPending}
        saveLabel="Save preferences"
        onSave={handleSave}
        onReset={() => setPreferences(saved)}
      />
    </div>
  )
}
