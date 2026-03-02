export type ToolSlug = 'guestlist' | 'checklist' | 'budget' | 'timeline' | 'memories' | 'events'

export interface ToolDefinition {
  slug: ToolSlug
  label: string
  description: string
  howToUse: string
  details: string[]
  steps: string[]
}

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    slug: 'guestlist',
    label: 'Guestlist',
    description: 'Manage invitees, RSVP states, and guest categories.',
    howToUse: 'Add guests, assign groups, then update RSVP as responses arrive.',
    details: [
      'Keep all attendee records in one place.',
      'Track accepted, declined, and pending responses.',
      'Use categories to separate family, friends, and vendors.',
    ],
    steps: [
      'Open an event.',
      'Go to Guestlist and add guests.',
      'Update RSVP statuses as confirmations come in.',
    ],
  },
  {
    slug: 'checklist',
    label: 'Checklist',
    description: 'Plan tasks and monitor completion progress.',
    howToUse: 'Create tasks with due dates and mark them complete as work is finished.',
    details: [
      'Break planning into manageable tasks.',
      'Track pending and completed tasks clearly.',
      'Keep everyone aligned on what is next.',
    ],
    steps: [
      'Open an event.',
      'Go to Checklist and add tasks.',
      'Mark each task complete when done.',
    ],
  },
  {
    slug: 'budget',
    label: 'Budget',
    description: 'Track planned versus actual spending across categories.',
    howToUse: 'Set budget entries and update paid amounts to monitor variance.',
    details: [
      'Organize costs by category.',
      'Compare budgeted and paid values.',
      'Spot overruns early and adjust quickly.',
    ],
    steps: [
      'Open an event.',
      'Go to Budget and add cost items.',
      'Update payment status and amounts over time.',
    ],
  },
  {
    slug: 'timeline',
    label: 'Timeline',
    description: 'Schedule the full run-of-show for your event day.',
    howToUse: 'Add key moments in order so everyone knows the sequence.',
    details: [
      'Define time slots for all major milestones.',
      'Keep the day-of flow easy to follow.',
      'Reduce execution surprises with a clear schedule.',
    ],
    steps: [
      'Open an event.',
      'Go to Timeline and add time blocks.',
      'Refine order and details before the event.',
    ],
  },
  {
    slug: 'memories',
    label: 'Memories',
    description: 'Collect and review event media uploads.',
    howToUse: 'Enable memory sharing and approve submitted photos/videos.',
    details: [
      'Centralize uploaded photos and clips.',
      'Review and approve submissions as needed.',
      'Keep event memories organized and accessible.',
    ],
    steps: [
      'Open an event.',
      'Go to Memories to review uploads.',
      'Approve or remove submissions based on your preference.',
    ],
  },
  {
    slug: 'events',
    label: 'Events',
    description: 'Create and manage all your planning events.',
    howToUse: 'Create new events and switch between active planning workspaces.',
    details: [
      'Central hub for all event records.',
      'Open any event to access planning tools.',
      'Keep multiple events organized from one place.',
    ],
    steps: [
      'Open the Events page.',
      'Create or select an event.',
      'Use event-level tools from that event workspace.',
    ],
  },
]

export const TOOL_MAP: Record<ToolSlug, ToolDefinition> = TOOL_CATALOG.reduce(
  (acc, tool) => {
    acc[tool.slug] = tool
    return acc
  },
  {} as Record<ToolSlug, ToolDefinition>,
)
