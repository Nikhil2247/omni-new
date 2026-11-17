import Link from 'next/link'
import { CreateEventForm } from '@/components/forms/event/create-event-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewEventPage() {
  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild className="px-0">
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to events
        </Link>
      </Button>

      <div>
        <h1 className="text-xl font-semibold sm:text-lg">Create a new event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start planning by capturing the essentials first.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-4">
        <CreateEventForm />
      </div>
    </div>
  )
}
