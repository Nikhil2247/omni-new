export interface ChecklistItem {
  id: string
  checklistId: string
  title: string
  description?: string | null
  dueDate?: string | null
  isCompleted: boolean
  completedAt?: string | null
  sortOrder: number
  createdAt: string
}

export interface Checklist {
  id: string
  eventId: string
  name: string
  sortOrder: number
  createdAt: string
  items?: ChecklistItem[]
}

export interface CreateChecklistInput {
  eventId: string
  name: string
  sortOrder?: number
}

export interface CreateChecklistItemInput {
  title: string
  description?: string
  dueDate?: string
  sortOrder?: number
}

export interface UpdateChecklistItemInput {
  title?: string
  description?: string
  dueDate?: string
  isCompleted?: boolean
  sortOrder?: number
}
