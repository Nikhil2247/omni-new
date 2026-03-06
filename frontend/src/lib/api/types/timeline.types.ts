export interface TimelineItem {
  id?: string
  title: string
  description?: string | null
  scheduledTime?: string // Time in "HH:MM" or "HH:MM AM/PM" format
  duration?: number | null
  isCompleted?: boolean
  completedAt?: string | null
}

export interface Timeline {
  id: string
  eventId: string
  name: string
  date: string
  items: TimelineItem[]
  createdAt: string
}

export interface CreateTimelineInput {
  eventId: string
  name: string
  eventDate: string
}
