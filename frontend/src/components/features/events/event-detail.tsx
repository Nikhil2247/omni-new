'use client'

import Link from 'next/link'
import { CalendarDays, MapPin, Users, ClipboardList, Wallet, UsersRound, Image, CalendarClock, Settings2, Handshake, Sparkles, Clock, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react'
import { useEvent } from '@/hooks/queries/use-events'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import type { EventStatus } from '@/lib/api/types/event.types'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const statusStyles: Record<EventStatus, { bg: string; text: string; border: string; icon: string }> = {
  PLANNING: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-700 dark:text-blue-400', 
    border: 'border-blue-500/20',
    icon: 'bg-blue-100 dark:bg-blue-900/30'
  },
  CONFIRMED: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-700 dark:text-emerald-400', 
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  IN_PROGRESS: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-700 dark:text-amber-400', 
    border: 'border-amber-500/20',
    icon: 'bg-amber-100 dark:bg-amber-900/30'
  },
  COMPLETED: { 
    bg: 'bg-slate-500/10', 
    text: 'text-slate-700 dark:text-slate-400', 
    border: 'border-slate-500/20',
    icon: 'bg-slate-100 dark:bg-slate-900/30'
  },
  CANCELLED: { 
    bg: 'bg-red-500/10', 
    text: 'text-red-700 dark:text-red-400', 
    border: 'border-red-500/20',
    icon: 'bg-red-100 dark:bg-red-900/30'
  },
}

const quickLinks = [
  { 
    href: 'checklist', 
    icon: ClipboardList, 
    label: 'Checklist', 
    description: 'Track your tasks',
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  { 
    href: 'budget', 
    icon: Wallet, 
    label: 'Budget', 
    description: 'Manage expenses',
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  { 
    href: 'guestlist', 
    icon: UsersRound, 
    label: 'Guest List', 
    description: 'Manage invitations',
    gradient: 'from-purple-500 to-pink-500',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  { 
    href: 'timeline', 
    icon: CalendarClock, 
    label: 'Timeline', 
    description: 'Event schedule',
    gradient: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400'
  },
  { 
    href: 'memories', 
    icon: Image, 
    label: 'Memories', 
    description: 'Photos & videos',
    gradient: 'from-pink-500 to-rose-500',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400'
  },
]

export function EventDetail({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useEvent(eventId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-sm text-destructive">Unable to load event details.</div>
  }

  const statusLabel = (data.status || 'PLANNING').replace(/_/g, ' ')
  const statusStyle = statusStyles[data.status || 'PLANNING']
  const eventDate = data.eventDate || data.date || null
  const daysUntilEvent = eventDate ? Math.ceil((new Date(eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  const checklists = Array.isArray((data as any).checklists) ? (data as any).checklists : []
  const timelines = Array.isArray((data as any).timelines) ? (data as any).timelines : []
  const vendors = Array.isArray((data as any).vendors) ? (data as any).vendors : []
  const budgetTotal = Number((data as any).budget?.totalBudget ?? (data as any).totalBudget ?? 0)
  const budgetSpent = Number((data as any).totalSpent ?? 0)
  const checklistProgress = data.checklistProgress ?? 0
  const checklistTotal = checklists.length
  const checklistCompletedEstimate = Math.round((checklistProgress / 100) * checklistTotal)
  const addressLine = (data as any).address?.addressLine1
  const eventTypeName = (data as any).eventType?.name

  return (
    <div className="space-y-4">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        
        <div className="relative z-10 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} backdrop-blur-sm`}>
                  {statusLabel}
                </Badge>
                {daysUntilEvent !== null && daysUntilEvent > 0 && (
                  <Badge variant="outline" className="backdrop-blur-sm">
                    <Clock className="mr-1.5 h-3 w-3" />
                    {daysUntilEvent} days to go
                  </Badge>
                )}
              </div>
              
              <div>
                <h1 className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400 md:text-4xl">
                  {data.name || 'Event'}
                </h1>
                {data.description && (
                  <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                    {data.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 md:gap-4">
                {eventDate && (
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${statusStyle.icon}`}>
                      <CalendarDays className={`h-4 w-4 ${statusStyle.text}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Event Date</p>
                      <p className="text-sm font-semibold">{new Date(eventDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                )}
                {data.venueName && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Venue</p>
                      <p className="text-sm font-semibold">{data.venueName}</p>
                    </div>
                  </div>
                )}
                {eventTypeName && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Event Type</p>
                      <p className="text-sm font-semibold">{eventTypeName}</p>
                    </div>
                  </div>
                )}
                {addressLine && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900/30">
                      <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-semibold">{addressLine}</p>
                    </div>
                  </div>
                )}
                {data.guestCount && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                      <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Guests</p>
                      <p className="text-sm font-semibold">{data.guestCount} people</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button asChild size="sm" className="shrink-0">
              <Link href={`/events/${data.id}/settings`}>
                <Settings2 className="mr-2 h-4 w-4" />
                Event Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{checklistTotal}</p>
                <p className="text-xs text-muted-foreground">Checklists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(budgetTotal)}</p>
                <p className="text-xs text-muted-foreground">Planned Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Handshake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{vendors.length}</p>
                <p className="text-xs text-muted-foreground">Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Image className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{timelines.length}</p>
                <p className="text-xs text-muted-foreground">Timelines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-base">Planning Progress</CardTitle>
            </div>
            <span className="text-xl font-bold text-primary">{checklistProgress}%</span>
          </div>
          <CardDescription className="text-xs">Track your event planning journey</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={checklistProgress} className="h-3" />
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{checklistCompletedEstimate} checklists completed (est.)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{Math.max(checklistTotal - checklistCompletedEstimate, 0)} checklists pending (est.)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget spent: {formatCurrency(budgetSpent)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={`/events/${data.id}/${link.href}`}>
                <Card className="group cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.iconBg} transition-transform group-hover:scale-105`}>
                          <Icon className={`h-5 w-5 ${link.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                            {link.label}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {link.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
