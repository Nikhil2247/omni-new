'use client'

import Link from 'next/link'
import { useOpsSupportTickets } from '@/hooks/queries/use-ops'

export function OpsSupportList() {
  const { data, isLoading, error } = useOpsSupportTickets()

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading support tickets...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load support tickets.</div>
  }

  if (!data?.length) {
    return <div className="text-sm text-muted-foreground">No support tickets found.</div>
  }

  return (
    <div className="space-y-3">
      {data.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/ops/support/${ticket.id}`}
          className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{ticket.subject || `Ticket ${ticket.id}`}</p>
              <p className="text-xs text-muted-foreground">
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Created date N/A'}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
              {ticket.status || 'OPEN'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
