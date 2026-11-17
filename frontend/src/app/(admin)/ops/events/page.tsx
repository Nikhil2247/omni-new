import { OpsEventsList } from '@/components/features/ops'

export default function OpsEventsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Manage all active events and their operations
        </p>
      </div>
      <OpsEventsList />
    </div>
  )
}
