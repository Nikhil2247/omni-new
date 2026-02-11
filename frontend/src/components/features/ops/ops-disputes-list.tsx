'use client'

import Link from 'next/link'
import { useOpsDisputes } from '@/hooks/queries/use-ops'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Calendar } from 'lucide-react'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    case 'INVESTIGATING':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
    case 'RESOLVED':
      return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
    case 'ESCALATED':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
    case 'CLOSED':
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
    default:
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
  }
}

export function OpsDisputesList() {
  const { data, isLoading, error } = useOpsDisputes()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load disputes. Please try again.</div>
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No disputes found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((dispute) => (
        <Link key={dispute.id} href={`/ops/disputes/${dispute.id}`}>
          <Card className="transition-all hover:shadow-sm hover:border-primary/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-red-500/10">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm font-medium">
                      {dispute.description?.substring(0, 60) || `Dispute ${dispute.id.substring(0, 8)}`}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'Date N/A'}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(dispute.status)}>
                  {dispute.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
