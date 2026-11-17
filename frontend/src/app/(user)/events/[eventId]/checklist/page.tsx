'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChecklistPanel } from '@/components/features/events/checklist-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useChecklist } from '@/hooks/queries/use-checklists'
import { Brush, Eyebrow, Paper, SketchButton } from '@/components/sketch'
import { ArrowLeft } from 'lucide-react'

export default function ChecklistPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: checklist } = useChecklist(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-checklist', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const totalTasks = checklist?.tasks?.length || 0
  const completedTasks = checklist?.tasks?.filter((t: any) => t.isCompleted).length || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const overdueTasks = checklist?.tasks?.filter((t: any) => {
    if (t.isCompleted || !t.dueDate) return false
    return new Date(t.dueDate) < new Date()
  }).length || 0

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <header>
        <SketchButton variant="ghost" size="sm" asChild className="mb-3">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
        </SketchButton>

        <Eyebrow>Event Checklist</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Tasks &amp; <Brush>To-dos</Brush>
        </h1>
        <p className="text-ink-soft mt-2 text-base">
          {event?.name ? (
            <>
              Manage tasks for <span className="text-ink font-semibold">{event.name}</span>
            </>
          ) : (
            'Organize your event tasks and never miss a detail'
          )}
        </p>

        {/* Quick Stats */}
        <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          <Paper className="px-4 py-3">
            <p className="sk-eyebrow">Progress</p>
            <p className="font-display text-2xl font-semibold">{progress}%</p>
          </Paper>
          <Paper alt className="px-4 py-3">
            <p className="sk-eyebrow">Completed</p>
            <p className="font-display text-2xl font-semibold">
              {completedTasks} / {totalTasks}
            </p>
          </Paper>
          <Paper className="col-span-2 px-4 py-3 sm:col-span-1">
            <p className="sk-eyebrow">Overdue</p>
            <p className={`font-display text-2xl font-semibold ${overdueTasks > 0 ? 'text-rose' : ''}`}>
              {overdueTasks}
            </p>
          </Paper>
        </div>
      </header>

      {/* Checklist Panel */}
      <ChecklistPanel eventId={eventId} />
    </div>
  )
}
