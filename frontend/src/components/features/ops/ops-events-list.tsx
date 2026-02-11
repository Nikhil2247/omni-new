'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useOpsActiveEvents } from '@/hooks/queries/use-ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CalendarIcon,
  DollarSign,
  MapPin,
  PartyPopper,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'REQUIREMENTS_SET', label: 'Requirements Set' },
  { value: 'VENDOR_SOURCING', label: 'Vendor Sourcing' },
  { value: 'CONTRACTS_LOCKED', label: 'Contracts Locked' },
  { value: 'EXECUTION', label: 'Execution' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NEW: { label: 'New', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', icon: <Clock className="h-3 w-3" /> },
  ASSIGNED: { label: 'Assigned', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20', icon: <Clock className="h-3 w-3" /> },
  REQUIREMENTS_SET: { label: 'Requirements Set', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20', icon: <Clock className="h-3 w-3" /> },
  VENDOR_SOURCING: { label: 'Vendor Sourcing', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  CONTRACTS_LOCKED: { label: 'Contracts Locked', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20', icon: <Clock className="h-3 w-3" /> },
  EXECUTION: { label: 'Execution', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
}

type ViewMode = 'grid' | 'list'

export function OpsEventsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { data, isLoading, error } = useOpsActiveEvents()

  const filteredEvents = useMemo(() => {
    if (!data) return []
    return data.filter((event) => {
      const matchesSearch =
        searchQuery === '' ||
        event.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venueName?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data, searchQuery, statusFilter])

  const statusStats = useMemo(() => {
    if (!data) return {}
    return data.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [data])

  const getStatusColor = (status: string) => {
    return STATUS_CONFIG[status]?.color || 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive font-medium">Failed to load events</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  const totalEvents = data?.length || 0
  const activeEvents = data?.filter(e => !['COMPLETED', 'CANCELLED'].includes(e.status)).length || 0

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <PartyPopper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{statusStats['COMPLETED'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <AlertTriangle className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Execution</p>
                <p className="text-2xl font-bold">{statusStats['EXECUTION'] || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[280px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/ops/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Events Display */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PartyPopper className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No events found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first event to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link href="/ops/events/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Link key={event.id} href={`/ops/events/${event.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <PartyPopper className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{event.clientName}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{event.eventType}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStatusColor(event.status)}>
                      {STATUS_CONFIG[event.status]?.icon}
                      <span className="ml-1">{event.status.replace(/_/g, ' ')}</span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {event.origin.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="p-1.5 rounded bg-blue-500/10">
                        <CalendarIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-muted-foreground">
                        {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD'}
                      </span>
                    </div>

                    {event.venueName && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded bg-purple-500/10">
                          <MapPin className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-muted-foreground truncate">{event.venueName}</span>
                      </div>
                    )}

                    {event.totalBudget && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded bg-green-500/10">
                          <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${Number(event.totalBudget).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <Link key={event.id} href={`/ops/events/${event.id}`}>
              <Card className="transition-all hover:shadow-sm hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <PartyPopper className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{event.clientName}</p>
                        <p className="text-sm text-muted-foreground">{event.eventType}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      {event.venueName && (
                        <div className="flex items-center gap-2 max-w-[150px]">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{event.venueName}</span>
                        </div>
                      )}
                      {event.totalBudget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium text-green-600">${Number(event.totalBudget).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="hidden sm:flex text-xs">
                        {event.origin.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
