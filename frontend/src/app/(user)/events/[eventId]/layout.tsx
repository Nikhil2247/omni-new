'use client'

import { useMemo } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EventToolLayoutProps {
  children: React.ReactNode
}

export default function EventToolLayout({ children }: EventToolLayoutProps) {
  const params = useParams<{ eventId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const currentEventId = params?.eventId
  const { data: response } = useEvents()
  const events = response?.data ?? []

  const currentToolSegment = useMemo(() => {
    if (!pathname || !currentEventId) return ''

    const marker = `/events/${currentEventId}`
    const index = pathname.indexOf(marker)
    if (index === -1) return ''

    const tail = pathname.slice(index + marker.length)
    return tail.startsWith('/') ? tail.slice(1) : tail
  }, [pathname, currentEventId])

  const handleEventChange = (eventId: string) => {
    if (!eventId) return

    const nextPath = currentToolSegment
      ? `/events/${eventId}/${currentToolSegment}`
      : `/events/${eventId}`

    router.push(nextPath)
  }

  return (
    <div className="space-y-4">
      <div className="sk-paper px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-ink-soft inline-flex items-center gap-2 text-sm font-bold">
            <Calendar className="h-4 w-4" />
            Selected Event
          </div>
          <Select value={currentEventId} onValueChange={handleEventChange}>
            <SelectTrigger className="border-ink bg-card w-full border-2 sm:w-70">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {children}
    </div>
  )
}
