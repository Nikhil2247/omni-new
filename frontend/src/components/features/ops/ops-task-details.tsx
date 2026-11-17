'use client'

import { useOpsOperationalTask } from '@/hooks/queries/use-ops'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle } from 'lucide-react'

const priorityColors = {
  URGENT: 'destructive',
  HIGH: 'default',
  NORMAL: 'secondary',
  LOW: 'outline',
} as const

export function OpsTaskDetails({ taskId }: { taskId: string }) {
  const { data, isLoading, error } = useOpsOperationalTask(taskId)

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
        <CardContent className="py-4 text-center">
          <p className="text-sm text-destructive">Failed to load task details.</p>
        </CardContent>
      </Card>
    )
  }

  const dueDate = data.dueDate ? new Date(data.dueDate) : null
  const isOverdue = dueDate && dueDate < new Date() && data.status !== 'COMPLETED'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-2xl">{data.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={priorityColors[data.priority as keyof typeof priorityColors] || 'secondary'}>
              {data.priority}
            </Badge>
            <Badge variant="outline">{data.status.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.description && (
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{data.description}</p>
          </div>
        )}

        <div className="grid gap-4">
          {dueDate && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {dueDate.toLocaleString()}
                  </p>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
