import { OpsEventsList } from '@/components/features/ops'

export default function OpsEventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Manage all active events and their operations
        </p>
      </div>
      <OpsEventsList />
    </div>
  )
}
