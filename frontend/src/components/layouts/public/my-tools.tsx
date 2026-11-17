'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { skBtn } from '@/components/sketch'
import type { MyToolsData } from './use-my-tools'

function formatDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * A signed-in host's planning tools for their latest event, with a note on which ones they have started.
 * When there is no event yet, it explains that and offers to create one.
 */
export function MyToolsPanel({
  data,
  onNavigate,
  renderRow,
}: {
  data: MyToolsData
  onNavigate?: () => void
  /** Lets a dropdown wrap each row in its own menu item. */
  renderRow?: (row: React.ReactNode, key: string) => React.ReactNode
}) {
  const wrap = renderRow ?? ((row: React.ReactNode, key: string) => <div key={key}>{row}</div>)

  if (data.isLoading) {
    return <p className="text-ink-soft px-3 py-4 text-sm">Loading your tools...</p>
  }

  if (!data.hasEvent) {
    return (
      <div className="px-3 py-3">
        <p className="font-display text-[1.05rem] font-semibold">No event yet</p>
        <p className="text-ink-soft mt-1 text-sm">
          Create your event and your guest list, checklist, budget and timeline unlock here.
        </p>
        <Link href="/events/new" onClick={onNavigate} className={cn(skBtn('solid', 'sm'), 'mt-3')}>
          Create your first event
        </Link>
      </div>
    )
  }

  const event = data.event!
  const date = formatDate(event.eventDate ?? event.date)

  return (
    <div>
      <div className="border-line border-b-2 border-dashed px-3 pt-2.5 pb-2.5">
        <p className="text-ink-soft text-[0.7rem] font-bold tracking-[0.14em] uppercase">Tools for</p>
        <p className="font-display truncate text-[1.05rem] font-semibold">{event.name}</p>
        {date ? (
          <p className="text-ink-soft mt-0.5 flex items-center gap-1 text-xs">
            <Calendar className="size-3" /> {date}
          </p>
        ) : null}
      </div>
      <div className="py-1">
        {data.tools.map((t) =>
          wrap(
            <Link
              href={t.href}
              onClick={onNavigate}
              className="hover:bg-accent flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium"
            >
              <span>{t.label}</span>
              {t.started === null ? (
                <span className="text-ink-soft text-xs font-normal">{t.status}</span>
              ) : (
                <span className={cn('sk-stamp !rotate-0', !t.started && 'sk-stamp--wait')}>{t.status}</span>
              )}
            </Link>,
            t.key,
          ),
        )}
      </div>
      <div className="border-line border-t-2 border-dashed px-3 py-2 text-sm">
        {wrap(
          <Link href="/events" onClick={onNavigate} className="text-blue font-bold hover:underline">
            All events ({data.eventCount}) →
          </Link>,
          'all-events',
        )}
      </div>
    </div>
  )
}
