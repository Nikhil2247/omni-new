'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { trackDashboard } from '@/lib/analytics/umami'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, CheckSquare, Clock3, Images, PlusCircle, Users, Wallet } from 'lucide-react'
import { TOOL_CATALOG } from '@/lib/tools/tool-catalog'

export default function UserToolsPage() {
  useEffect(() => {
    trackDashboard.sectionView('tools', 'user')
  }, [])

  const iconMap = {
    guestlist: Users,
    checklist: CheckSquare,
    budget: Wallet,
    timeline: Clock3,
    memories: Images,
    events: Calendar,
  } as const

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Planning Tools</h1>
            <p className="mt-1 text-sm text-muted-foreground">Open each tool guide to understand what it does and how to use it for your event planning workflow.</p>
          </div>
          <Button asChild>
            <Link href="/events/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOL_CATALOG.map((tool) => {
          const Icon = iconMap[tool.slug]
          return (
            <Link key={tool.slug} href={`/tools/${tool.slug}`}>
              <Card className="h-full border-2 transition-all hover:border-primary hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="bg-primary/10 text-primary rounded-lg p-2">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">Guide</Badge>
                  </div>
                  <CardTitle className="text-base">{tool.label}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {tool.howToUse}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
