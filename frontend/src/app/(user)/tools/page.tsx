'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { trackDashboard } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, CheckSquare, Clock3, Images, PlusCircle, Users, Wallet, Sparkles } from 'lucide-react'
import { TOOL_CATALOG } from '@/lib/tools/tool-catalog'
import { useEvents } from '@/hooks/queries/use-events'
import { cn } from '@/lib/utils'

const TOOL_STYLES = {
  guestlist: {
    icon: Users,
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    hover: 'hover:border-violet-300 dark:hover:border-violet-700',
  },
  checklist: {
    icon: CheckSquare,
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  budget: {
    icon: Wallet,
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    hover: 'hover:border-amber-300 dark:hover:border-amber-700',
  },
  timeline: {
    icon: Clock3,
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-400',
    hover: 'hover:border-sky-300 dark:hover:border-sky-700',
  },
  memories: {
    icon: Images,
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    hover: 'hover:border-pink-300 dark:hover:border-pink-700',
  },
  events: {
    icon: Calendar,
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
} as const

const EVENT_TOOL_SEGMENTS: Partial<Record<string, string>> = {
  guestlist: 'guestlist',
  checklist: 'checklist',
  budget: 'budget',
  timeline: 'timeline',
  memories: 'memories',
}

export default function UserToolsPage() {
  const { data: eventsData } = useEvents({ page: 1, limit: 1 })
  const primaryEvent = eventsData?.data?.[0]
  const eventId = primaryEvent?.id

  useEffect(() => {
    trackDashboard.sectionView('tools', 'user')
  }, [])

  function getToolHref(slug: string): string {
    if (slug === 'events') return '/events'
    const segment = EVENT_TOOL_SEGMENTS[slug]
    if (segment && eventId) return `/events/${eventId}/${segment}`
    return `/events/new`
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Planning Tools</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {primaryEvent
                ? <>Planning for <span className="font-medium text-foreground">{primaryEvent.name}</span></>
                : 'Everything you need to plan your perfect event, in one place.'}
            </p>
          </div>
          <Button asChild className="self-start rounded-full sm:self-auto" variant={primaryEvent ? 'outline' : 'default'}>
            <Link href={primaryEvent ? '/events' : '/events/new'}>
              {primaryEvent ? (
                <><Calendar className="mr-2 h-4 w-4" />My Events</>
              ) : (
                <><PlusCircle className="mr-2 h-4 w-4" />New Event</>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* No-event banner */}
      {!eventId && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Create an event first</p>
            <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/80">
              Each tool is linked to an event.{' '}
              <Link href="/events/new" className="font-semibold underline underline-offset-2">
                Create your first event
              </Link>{' '}
              to start using Guestlist, Checklist, Budget, and more.
            </p>
          </div>
        </div>
      )}

      {/* Tool cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOL_CATALOG.map((tool) => {
          const style = TOOL_STYLES[tool.slug]
          const Icon = style.icon
          const href = getToolHref(tool.slug)
          const isDirectTool = tool.slug !== 'events' && !!eventId

          return (
            <Link
              key={tool.slug}
              href={href}
              className={cn(
                'group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md',
                style.hover,
              )}
            >
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', style.bg)}>
                <Icon className={cn('h-5 w-5', style.text)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight transition-colors group-hover:text-primary">{tool.label}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {isDirectTool ? `Open for ${primaryEvent?.name}` : tool.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
            </Link>
          )
        })}
      </div>

      {/* Switch event hint */}
      {eventId && eventsData?.meta && Number(eventsData.meta.total) > 1 && (
        <p className="text-center text-xs text-muted-foreground">
          Tools are linked to your most recent event.{' '}
          <Link href="/events" className="font-medium underline underline-offset-2">
            Switch event
          </Link>
        </p>
      )}
    </div>
  )
}
