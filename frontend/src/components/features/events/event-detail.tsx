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
  const daysUntilEvent = data.date ? Math.ceil((new Date(data.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="space-y-6">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {data.name || 'Event'}
                </h1>
                {data.description && (
                  <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">
                    {data.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                {data.date && (
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusStyle.icon}`}>
                      <CalendarDays className={`h-5 w-5 ${statusStyle.text}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Event Date</p>
                      <p className="font-semibold">{new Date(data.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                )}
                {data.venueName && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Venue</p>
                      <p className="font-semibold">{data.venueName}</p>
                    </div>
                  </div>
                )}
                {data.guestCount && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/30">
                      <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Guests</p>
                      <p className="font-semibold">{data.guestCount} people</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button asChild size="lg" className="shrink-0">
              <Link href={`/events/${data.id}/settings`}>
                <Settings2 className="mr-2 h-4 w-4" />
                Event Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹0</p>
                <p className="text-xs text-muted-foreground">Budget Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <UsersRound className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.guestCount || 0}</p>
                <p className="text-xs text-muted-foreground">Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <CardTitle>Planning Progress</CardTitle>
            </div>
            <span className="text-2xl font-bold text-primary">0%</span>
          </div>
          <CardDescription>Track your event planning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={0} className="h-3" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">0 tasks completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">0 tasks pending</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">No deadlines</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={`/events/${data.id}/${link.href}`}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${link.iconBg} transition-transform group-hover:scale-110`}>
                          <Icon className={`h-6 w-6 ${link.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {link.label}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
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
