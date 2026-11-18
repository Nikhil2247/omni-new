'use client'

import Link from 'next/link'
import { User, Bell, Shield } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/dash'

const items: { title: string; href: string; icon: LucideIcon; iconColor: string }[] = [
  { title: 'Profile', href: '/marketing/settings/profile', icon: User, iconColor: 'text-primary' },
  { title: 'Notifications', href: '/marketing/settings/notifications', icon: Bell, iconColor: 'text-warning' },
  { title: 'Security', href: '/marketing/settings/security', icon: Shield, iconColor: 'text-success' },
]

export default function MarketingSettingsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Settings" />

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title, href, icon: Icon, iconColor }) => (
          <Link
            key={href}
            href={href}
            className="bg-card hover:bg-accent group flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Icon className={`h-4 w-4 ${iconColor}`} />
              {title}
            </span>
            <span className="text-primary text-xs group-hover:underline">Manage →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
