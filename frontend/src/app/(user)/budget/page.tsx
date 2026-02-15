'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Calendar, ChevronRight, Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Sparkles } from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import type { EventSummary } from '@/lib/api/types/event.types'
import Link from 'next/link'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface EventBudgetData extends EventSummary {
  totalBudget: number
  totalSpent: number
}

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

export default function BudgetPage() {
  const router = useRouter()
  const { data: response, isLoading } = useEvents()
  const events = response?.data ?? []

  const eventsWithBudget: EventBudgetData[] = events.map((event) => ({
    ...event,
    totalBudget: Number(event.totalBudget ?? 0),
    totalSpent: Number(event.totalSpent ?? 0),
  }))

  // If user has only one event, redirect to that event's budget
  useEffect(() => {
    if (eventsWithBudget.length === 1) {
      router.replace(`/events/${eventsWithBudget[0].id}/budget`)
    }
  }, [eventsWithBudget, router])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (eventsWithBudget.length === 0) {
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
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 shadow-lg"
            >
              <DollarSign className="h-10 w-10 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">No Events Yet</CardTitle>
            <CardDescription className="text-base">
              Create your first event to start tracking your wedding budget
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

  // Calculate totals across all events
  const totalBudget = eventsWithBudget.reduce((sum, e) => sum + (e.totalBudget || 0), 0)
  const totalSpent = eventsWithBudget.reduce((sum, e) => sum + (e.totalSpent || 0), 0)
  const remaining = totalBudget - totalSpent
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

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
        className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 shadow-lg"
              >
                <DollarSign className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Budget Manager
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Track your wedding expenses across all events
                </p>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm px-6 py-4 shadow-lg"
            >
              <div className="text-right">
                <p className="text-3xl font-bold bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {percentUsed}%
                </p>
                <p className="text-sm text-muted-foreground">Budget Used</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Budget</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <Wallet className="h-7 w-7 text-blue-600 dark:text-blue-400" />
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
                  <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
                  <TrendingUp className="h-7 w-7 text-orange-600 dark:text-orange-400" />
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
                  <p className="text-sm text-muted-foreground mb-2">Remaining</p>
                  <p className={`text-3xl font-bold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  remaining < 0 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  <PiggyBank className={`h-7 w-7 ${
                    remaining < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Event Budgets */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-semibold">Event Budgets</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventsWithBudget.map((event, index) => {
            const eventPercent = event.totalBudget
              ? Math.round(((event.totalSpent || 0) / event.totalBudget) * 100)
              : 0
            const isOverBudget = eventPercent > 100

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
              >
                <Link href={`/events/${event.id}/budget`}>
                  <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-xl border-2 hover:border-primary/50">
                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-muted">
                      <div
                        className={`h-full transition-all ${
                          isOverBudget
                            ? 'bg-linear-to-r from-red-500 to-rose-600'
                            : eventPercent > 75
                            ? 'bg-linear-to-r from-yellow-500 to-orange-500'
                            : 'bg-linear-to-r from-green-500 to-emerald-600'
                        }`}
                        style={{ width: `${Math.min(eventPercent, 100)}%` }}
                      />
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
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
                        {isOverBudget && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400"
                          >
                            <TrendingDown className="h-3 w-3" />
                            Over
                          </motion.span>
                        )}
                      </div>
                      <CardTitle className="text-lg transition-colors group-hover:text-primary">
                        {event.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">
                            {formatCurrency(event.totalSpent || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            of {formatCurrency(event.totalBudget || 0)}
                          </p>
                        </div>
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className={`rounded-xl px-4 py-2 text-lg font-bold ${
                            isOverBudget
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              : eventPercent > 75
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          }`}
                        >
                          {eventPercent}%
                        </motion.div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">View details</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
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
