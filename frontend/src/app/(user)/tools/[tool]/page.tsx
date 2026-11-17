'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEvents } from '@/hooks/queries/use-events'
import { TOOL_MAP, type ToolSlug } from '@/lib/tools/tool-catalog'
import { Brush, Eyebrow, Ico, ICONS, PaintedNum, Paper, SketchButton, type IcoName } from '@/components/sketch'

const EVENT_TOOL_SEGMENTS: Partial<Record<ToolSlug, string>> = {
  guestlist: 'guestlist',
  checklist: 'checklist',
  budget: 'budget',
  timeline: 'timeline',
  memories: 'memories',
}

const TOOL_ICONS: Partial<Record<ToolSlug, IcoName>> = {
  guestlist: 'guests',
  checklist: 'planner',
  budget: 'wallet',
  timeline: 'clock',
  memories: 'gallery',
  events: 'calendar',
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
        <SketchButton asChild variant="ghost" size="sm">
          <Link href="/tools">Back to tools</Link>
        </SketchButton>
        <Paper className="px-5 py-4">
          <p className="text-ink-soft text-sm">Tool not found.</p>
        </Paper>
      </div>
    )
  }

  const icon = TOOL_ICONS[tool.slug] ?? 'star'

  return (
    <div className="space-y-6">
      {/* Back */}
      <SketchButton asChild variant="ghost" size="sm">
        <Link href="/tools">All tools</Link>
      </SketchButton>

      {/* Header */}
      <header className="flex items-start gap-4">
        <Ico d={ICONS[icon]} className="!size-14 shrink-0" />
        <div>
          <Eyebrow>Planning tool</Eyebrow>
          <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
            <Brush>{tool.label}</Brush>
          </h1>
          <p className="text-ink-soft mt-3 max-w-2xl">{tool.description}</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* What it helps with */}
        <Paper className="px-5 py-5">
          <h2 className="font-display text-xl font-semibold">What this tool helps with</h2>
          <ul className="mt-3 space-y-2">
            {tool.details.map((point) => (
              <li
                key={point}
                className="text-ink-soft border-line flex items-start gap-2.5 border-b-2 border-dashed pb-2 text-sm last:border-b-0 last:pb-0"
              >
                <PaintedNum tone="green" className="!size-6 shrink-0 text-xs">
                  ✓
                </PaintedNum>
                {point}
              </li>
            ))}
          </ul>
        </Paper>

        {/* Quick steps */}
        <Paper alt className="px-5 py-5">
          <h2 className="font-display text-xl font-semibold">Quick steps</h2>
          <ol className="mt-3 space-y-2">
            {tool.steps.map((step, index) => (
              <li
                key={step}
                className="text-ink-soft border-line flex items-start gap-2.5 border-b-2 border-dashed pb-2 text-sm last:border-b-0 last:pb-0"
              >
                <PaintedNum className="!size-6 shrink-0 text-xs">{index + 1}</PaintedNum>
                {step}
              </li>
            ))}
          </ol>
        </Paper>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <SketchButton asChild>
          <Link href={primaryAction.href}>{primaryAction.label}</Link>
        </SketchButton>
        <SketchButton asChild variant="line">
          <Link href="/events">All Events</Link>
        </SketchButton>
      </div>
    </div>
  )
}
