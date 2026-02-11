'use client'

import { useOpsActiveEvent } from '@/hooks/queries/use-ops'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, DollarSign, MapPin, User, Phone, Mail, Building } from 'lucide-react'

export function OpsEventDetails({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useOpsActiveEvent(eventId)

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive">Failed to load event details.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{data.clientName}</CardTitle>
              <p className="text-lg text-muted-foreground mt-1">{data.eventType}</p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {data.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {data.eventDate && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Event Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(data.eventDate).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {data.clientEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{data.clientEmail}</p>
                </div>
              </div>
            )}

            {data.clientPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{data.clientPhone}</p>
                </div>
              </div>
            )}

            {data.venueName && (
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Venue</p>
                  <p className="text-sm text-muted-foreground">{data.venueName}</p>
                </div>
              </div>
            )}

            {data.totalBudget && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Budget</p>
                  <p className="text-sm text-muted-foreground">
                    ${Number(data.totalBudget).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {data.totalSpend && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Spend</p>
                  <p className="text-sm text-muted-foreground">
                    ${Number(data.totalSpend).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
