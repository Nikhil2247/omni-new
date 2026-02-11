import Link from 'next/link'
import { CreateEventForm } from '@/components/forms/event/create-event-form'
import { Button } from '@/components/ui/button'

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Create a new event</h1>
          <p className="text-sm text-muted-foreground">
            Start planning by capturing the essentials first.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/events">Back to events</Link>
        </Button>
      </div>
      <CreateEventForm />
    </div>
  )
}
