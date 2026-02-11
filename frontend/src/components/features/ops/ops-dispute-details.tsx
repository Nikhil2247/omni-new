'use client'

import { useOpsDispute } from '@/hooks/queries/use-ops'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react'

const statusColors = {
  OPEN: 'destructive',
  INVESTIGATING: 'default',
  RESOLVED: 'outline',
  ESCALATED: 'destructive',
  CLOSED: 'secondary',
} as const

export function OpsDisputeDetails({ disputeId }: { disputeId: string }) {
  const { data, isLoading, error } = useOpsDispute(disputeId)

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive">Failed to load dispute details.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Dispute Details</CardTitle>
            {data.type && (
              <p className="text-sm text-muted-foreground">{data.type.replace(/_/g, ' ')}</p>
            )}
          </div>
          <Badge variant={statusColors[data.status as keyof typeof statusColors] || 'outline'}>
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.description && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Description
            </h3>
            <p className="text-sm text-muted-foreground">{data.description}</p>
          </div>
        )}

        {data.resolution && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resolution
            </h3>
            <p className="text-sm text-muted-foreground">{data.resolution}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {data.createdAt && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(data.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {data.resolvedAt && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Resolved</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(data.resolvedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
