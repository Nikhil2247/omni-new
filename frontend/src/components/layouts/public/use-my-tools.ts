'use client'

import { useEventsEnabled } from '@/hooks/queries/use-events'
import { useWishlistMine } from '@/hooks/queries/use-wishlists'
import type { Wishlist } from '@/lib/api/types/wishlist.types'

export interface MyTool {
  key: 'guestlist' | 'checklist' | 'budget' | 'timeline' | 'memories'
  label: string
  href: string
  /** Short status such as "42 guests" or "Not started". */
  status: string
  /** true = the user has made something here, false = not yet, null = no progress to report. */
  started: boolean | null
}

function money(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`
  return `₹${n}`
}

/**
 * What a signed-in user has set up so far: their latest event, whether each planning tool has been started,
 * and how many things they have saved to wishlists.
 */
export function useMyTools({ events, wishlist }: { events: boolean; wishlist: boolean }) {
  const eventsQuery = useEventsEnabled({ page: 1, limit: 5 }, events)
  const wishlistQuery = useWishlistMine(wishlist)

  const eventList = eventsQuery.data?.data ?? []
  const event = eventList[0]
  const lists = (Array.isArray(wishlistQuery.data) ? wishlistQuery.data : []) as Wishlist[]
  const savedCount = lists.reduce((n, l) => n + (l.items?.length ?? 0), 0)

  const tools: MyTool[] = event
    ? [
        {
          key: 'guestlist',
          label: 'Guest list',
          href: `/events/${event.id}/guestlist`,
          started: (event.guestCount ?? 0) > 0,
          status: (event.guestCount ?? 0) > 0 ? `${event.guestCount} guests` : 'Not started',
        },
        {
          key: 'checklist',
          label: 'Checklist',
          href: `/events/${event.id}/checklist`,
          started: (event.checklistProgress ?? 0) > 0,
          status: (event.checklistProgress ?? 0) > 0 ? `${Math.round(event.checklistProgress ?? 0)}% done` : 'Not started',
        },
        {
          key: 'budget',
          label: 'Budget',
          href: `/events/${event.id}/budget`,
          started: (event.totalBudget ?? 0) > 0,
          status: (event.totalBudget ?? 0) > 0 ? `${money(event.totalBudget ?? 0)} set` : 'Not set',
        },
        { key: 'timeline', label: 'Timeline', href: `/events/${event.id}/timeline`, started: null, status: 'Open' },
        { key: 'memories', label: 'Memories', href: `/events/${event.id}/memories`, started: null, status: 'Open' },
      ]
    : []

  return {
    event,
    eventCount: eventList.length,
    hasEvent: Boolean(event),
    tools,
    wishlistCount: lists.length,
    savedCount,
    isLoading: eventsQuery.isLoading,
  }
}

export type MyToolsData = ReturnType<typeof useMyTools>
