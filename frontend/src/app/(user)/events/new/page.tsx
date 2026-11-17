import Link from 'next/link'
import { CreateEventForm } from '@/components/forms/event/create-event-form'
import { Brush, Eyebrow, Paper, SketchButton } from '@/components/sketch'

export default function NewEventPage() {
  return (
    <div className="space-y-6 pb-6">
      <div>
        <SketchButton variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/events">Back to events</Link>
        </SketchButton>

        <Eyebrow>New event</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Create a new <Brush>event</Brush>
        </h1>
        <p className="text-ink-soft mt-3">Start planning by capturing the essentials first.</p>
      </div>

      <Paper className="max-w-4xl px-5 py-5 sm:px-7 sm:py-6">
        <CreateEventForm />
      </Paper>
    </div>
  )
}
