'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SettingsCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  iconColor?: string
}

export function SettingsCard({ title, description, href, icon: Icon, iconColor = 'text-primary' }: SettingsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <Link href={href}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description}
          <div className="mt-3">
            <span className="text-sm text-primary group-hover:underline">
              Manage →
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
