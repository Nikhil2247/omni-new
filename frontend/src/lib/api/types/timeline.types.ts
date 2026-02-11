export interface TimelineItem {
  id?: string
  time?: string // Backend uses 'time' field
  title: string
  description?: string | null
  scheduledTime?: string // Frontend field
  duration?: number | null
  isCompleted?: boolean
  completedAt?: string | null
}

export interface Timeline {
  id: string
  eventId: string
  name: string
  date: string
  items: string | TimelineItem[] // Backend returns JSON string
  createdAt: string
}

export interface CreateTimelineInput {
  eventId: string
  name: string
  eventDate: string
}
