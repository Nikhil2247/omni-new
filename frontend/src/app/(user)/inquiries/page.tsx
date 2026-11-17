'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useUserLeads } from '@/hooks/queries/use-leads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Clock, CheckCircle2, XCircle, ChevronRight, Calendar, Send, Inbox } from 'lucide-react'
import { trackDashboard } from '@/lib/analytics/umami'

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-500/10', icon: Clock },
  responded: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: MessageSquare },
  accepted: { color: 'text-green-600', bg: 'bg-green-500/10', icon: CheckCircle2 },
  declined: { color: 'text-red-600', bg: 'bg-red-500/10', icon: XCircle },
}

export default function InquiriesPage() {
  const { user } = useAuthStore()
  const plannerId = user?.id

  const { data, isLoading, error } = useUserLeads({
    plannerId: plannerId ?? '',
    page: 1,
    limit: 20,
  })

  useEffect(() => { trackDashboard.sectionView('inquiries', 'user') }, [])

  if (!plannerId) {
    return <div className="text-sm text-muted-foreground">Loading inquiries...</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load inquiries.</div>
  }

  const leads = data?.data ?? []
  const totalInquiries = leads.length
  const pendingCount = leads.filter(l => l.status.toLowerCase() === 'pending').length
  const respondedCount = leads.filter(l => l.status.toLowerCase() === 'responded').length
  const acceptedCount = leads.filter(l => l.status.toLowerCase() === 'accepted').length

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-4">
        <div className="relative z-10">
          <h1 className="text-lg font-semibold md:text-lg">Quote Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your vendor inquiries and quote responses
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{totalInquiries}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Awaiting Response</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Responded</p>
              <p className="text-2xl font-bold">{respondedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold">{acceptedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Inquiries List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Quote Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length > 0 ? (
            <div className="space-y-3">
              {leads.map((lead) => {
                const status = lead.status.toLowerCase()
                const config = statusConfig[status] || statusConfig.pending
                const StatusIcon = config.icon

                return (
                  <Link key={lead.id} href={`/inquiries/${lead.id}`}>
                    <div className="group flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                          <StatusIcon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium transition-colors group-hover:text-primary">
                            {lead.vendorProfile?.businessName ?? lead.vendorProfileId}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {lead.eventDate
                                ? new Date(lead.eventDate).toLocaleDateString()
                                : 'No date'}
                            </span>
                            <span>•</span>
                            <span>
                              Requested {new Date(lead.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={`capitalize ${config.bg} ${config.color}`}>
                          {status}
                        </Badge>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No inquiries yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start discovering vendors and send your first inquiry!
              </p>
              <Button asChild className="mt-4">
                <Link href="/vendors">Browse Vendors</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
