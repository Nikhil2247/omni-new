'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEvents } from '@/hooks/queries/use-events'
import { TOOL_MAP, type ToolSlug } from '@/lib/tools/tool-catalog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar } from 'lucide-react'

const EVENT_TOOL_SEGMENTS: Partial<Record<ToolSlug, string>> = {
  guestlist: 'guestlist',
  checklist: 'checklist',
  budget: 'budget',
  timeline: 'timeline',
  memories: 'memories',
}

export default function ToolDetailPage() {
  const params = useParams<{ tool: string }>()
  const toolSlug = params?.tool as ToolSlug
  const tool = TOOL_MAP[toolSlug]

  const { data } = useEvents({ page: 1, limit: 1 })
  const firstEventId = data?.data?.[0]?.id

  const primaryAction = useMemo(() => {
    if (!tool) {
      return {
        href: '/tools',
        label: 'Back to Tools',
      }
    }

    if (tool.slug === 'events') {
      return {
        href: '/events',
        label: 'Open Events',
      }
    }

    const segment = EVENT_TOOL_SEGMENTS[tool.slug]
    if (!segment || !firstEventId) {
      return {
        href: '/events/new',
        label: 'Create Event to Use Tool',
      }
    }

    return {
      href: `/events/${firstEventId}/${segment}`,
      label: `Open ${tool.label}`,
    }
  }, [firstEventId, tool])

  if (!tool) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tool not found</h1>
        <p className="text-sm text-muted-foreground">The requested tool guide does not exist.</p>
        <Button asChild>
          <Link href="/tools">Back to tools</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" asChild className="px-0">
          <Link href="/tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tools
          </Link>
        </Button>
        <h1 className="text-2xl font-bold md:text-3xl">{tool.label}</h1>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to use</CardTitle>
          <CardDescription>{tool.howToUse}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">What this tool helps with</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {tool.details.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Quick steps</p>
            <ol className="space-y-1 text-sm text-muted-foreground">
              {tool.steps.map((step, index) => (
                <li key={step}>{index + 1}. {step}</li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild>
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/events">
                <Calendar className="mr-2 h-4 w-4" />
                Go to Events
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
