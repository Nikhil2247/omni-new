import { CreateEventForm } from '@/components/forms/ops'

export default function OpsEventCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Active Event</h1>
        <p className="text-muted-foreground">Add a new event from operations.</p>
      </div>
      <CreateEventForm />
    </div>
  )
}
