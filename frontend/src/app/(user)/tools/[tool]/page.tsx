'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEvents } from '@/hooks/queries/use-events'
import { TOOL_MAP, type ToolSlug } from '@/lib/tools/tool-catalog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, CheckCircle2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    if (!tool) return { href: '/tools', label: 'Back to Tools' }
    if (tool.slug === 'events') return { href: '/events', label: 'Open Events' }
    const segment = EVENT_TOOL_SEGMENTS[tool.slug]
    if (!segment || !firstEventId) return { href: '/events/new', label: 'Create Event to Use' }
    return { href: `/events/${firstEventId}/${segment}`, label: `Open ${tool.label}` }
  }, [firstEventId, tool])

  if (!tool) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="px-0">
          <Link href="/tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tools
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Tool not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button variant="ghost" asChild className="px-0">
        <Link href="/tools">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All tools
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold sm:text-lg">{tool.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
      </div>

      {/* What it helps with */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold">What this tool helps with</p>
        <ul className="space-y-2">
          {tool.details.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Quick steps */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold">Quick steps</p>
        <ol className="space-y-2">
          {tool.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  'bg-primary/10 text-primary',
                )}
              >
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-full">
          <Link href={primaryAction.href}>
            {primaryAction.label}
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/events">
            <Calendar className="mr-2 h-4 w-4" />
            All Events
          </Link>
        </Button>
      </div>
    </div>
  )
}
