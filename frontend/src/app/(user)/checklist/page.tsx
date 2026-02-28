'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckSquare, Calendar, ChevronRight, Plus, ListChecks, Target, TrendingUp, Award, Sparkles } from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import { Progress } from '@/components/ui/progress'
import type { EventSummary } from '@/lib/api/types/event.types'
import { trackDashboard } from '@/lib/analytics/umami'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

export default function ChecklistPage() {
  const router = useRouter()
  const { data: response, isLoading } = useEvents()
  const events = response?.data ?? []
  const eventsWithChecklist: EventSummary[] = events

  // If user has only one event, redirect to that event's checklist
  useEffect(() => {
    if (eventsWithChecklist.length === 1) {
      router.replace(`/events/${eventsWithChecklist[0].id}/checklist`)
    }
  }, [eventsWithChecklist, router])

  useEffect(() => { trackDashboard.sectionView('checklist', 'user') }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (eventsWithChecklist.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex min-h-[60vh] items-center justify-center"
      >
        <Card className="mx-auto max-w-md border-2 border-dashed text-center">
          <CardHeader>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg"
            >
              <CheckSquare className="h-10 w-10 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">No Events Yet</CardTitle>
            <CardDescription className="text-base">
              Create your first event to start managing your wedding checklist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all">
              <Link href="/events/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Calculate overall progress
  const totalProgress = eventsWithChecklist.length > 0
    ? Math.round(eventsWithChecklist.reduce((acc, e) => acc + (e.checklistProgress || 0), 0) / eventsWithChecklist.length)
    : 0

  // Calculate completion categories
  const completed = eventsWithChecklist.filter(e => (e.checklistProgress || 0) === 100).length
  const inProgress = eventsWithChecklist.filter(e => {
    const progress = e.checklistProgress || 0
    return progress > 0 && progress < 100
  }).length
  const notStarted = eventsWithChecklist.filter(e => (e.checklistProgress || 0) === 0).length

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Hero Section with Gradient */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg"
              >
                <CheckSquare className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Wedding Checklists
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Stay organized and never miss a detail
                </p>
              </div>
            </div>

            {/* Overall Progress Circle */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-24 w-24 -rotate-90 transform">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 276.46" }}
                    animate={{ strokeDasharray: `${(totalProgress / 100) * 276.46} 276.46` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                      <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl font-bold"
                  >
                    {totalProgress}%
                  </motion.span>
                  <span className="text-xs text-muted-foreground">Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{completed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Event{completed !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
                  <Award className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold">{inProgress}</p>
                  <p className="text-xs text-muted-foreground mt-1">Event{inProgress !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Not Started</p>
                  <p className="text-3xl font-bold">{notStarted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Event{notStarted !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-900/30">
                  <Target className="h-7 w-7 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Events Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="mb-4 text-xl font-semibold">Event Checklists</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventsWithChecklist.map((event, index) => {
            const progress = event.checklistProgress || 0
            const isComplete = progress === 100

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
              >
                <Link href={`/events/${event.id}/checklist`}>
                  <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-xl border-2 hover:border-primary/50">
                    {/* Progress Bar Top */}
                    <div className="h-1.5 w-full bg-muted">
                      <div
                        className={`h-full transition-all ${
                          isComplete 
                            ? 'bg-linear-to-r from-green-500 to-emerald-600' 
                            : 'bg-linear-to-r from-blue-500 to-indigo-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {event.eventDate
                            ? new Date(event.eventDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'Date not set'}
                        </span>
                      </div>
                      <CardTitle className="text-lg transition-colors group-hover:text-primary">
                        {event.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                            isComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            {isComplete ? (
                              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                            ) : (
                              <ListChecks className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{progress}%</p>
                            <p className="text-xs text-muted-foreground">Complete</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                      <Progress value={progress} className="h-2" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
