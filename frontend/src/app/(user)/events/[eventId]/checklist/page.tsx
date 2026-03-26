'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChecklistPanel } from '@/components/features/events/checklist-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useChecklist } from '@/hooks/queries/use-checklists'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckSquare, ArrowLeft, ListChecks, Clock } from 'lucide-react'

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
    <div className="space-y-6 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-green-300/30 blur-3xl dark:bg-green-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-500/20" />

        <div className="relative">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to event
            </Link>
          </Button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 shadow-sm dark:bg-emerald-950/70 dark:text-emerald-200">
                Event Checklist
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tasks & To-dos
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {event?.name ? (
                  <>Manage tasks for <span className="font-medium text-foreground">{event.name}</span></>
                ) : (
                  'Organize your event tasks and never miss a detail'
                )}
              </p>

              {/* Quick Stats */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <p className="text-[11px] text-muted-foreground">Progress</p>
                  <p className="font-semibold">{progress}%</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <p className="text-[11px] text-muted-foreground">Completed</p>
                  <p className="font-semibold">{completedTasks} / {totalTasks}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/40 sm:col-span-1">
                  <p className="text-[11px] text-muted-foreground">Overdue</p>
                  <p className={`font-semibold ${overdueTasks > 0 ? 'text-red-600' : ''}`}>
                    {overdueTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg self-start lg:self-auto">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Panel */}
      <ChecklistPanel eventId={eventId} />
    </div>
  )
}
