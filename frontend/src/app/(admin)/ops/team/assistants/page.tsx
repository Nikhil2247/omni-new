'use client'

import Link from 'next/link'
import { useOpsAssistants } from '@/hooks/queries/use-ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, CheckSquare, Mail, User } from 'lucide-react'

export default function OpsAssistantsPage() {
  const { data: assistantsResponse, isLoading } = useOpsAssistants()

  const assistants = assistantsResponse?.data || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Operational Assistants</h1>
          <p className="text-muted-foreground">View and manage operational assistants</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/ops/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Operational Assistants</h1>
            <p className="text-muted-foreground">
              {assistants.length} assistant{assistants.length !== 1 ? 's' : ''} in the team
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assistants</p>
                <p className="text-3xl font-bold text-primary">{assistants.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks Assigned</p>
                <p className="text-3xl font-bold text-blue-600">
                  {assistants.reduce((sum, a) => sum + (a.assignedTasksCount || 0), 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Tasks per Assistant</p>
                <p className="text-3xl font-bold text-green-600">
                  {assistants.length > 0
                    ? Math.round(
                        assistants.reduce((sum, a) => sum + (a.assignedTasksCount || 0), 0) /
                          assistants.length
                      )
                    : 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assistants List */}
      {assistants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assistants Yet</h3>
            <p className="text-muted-foreground">
              No operational assistants have been added to the system yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant) => (
            <Card key={assistant.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {assistant.firstName && assistant.lastName
                          ? `${assistant.firstName} ${assistant.lastName}`
                          : assistant.email}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {assistant.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{assistant.email}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Assigned Tasks</span>
                  <Badge variant="secondary">{assistant.assignedTasksCount || 0}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Joined {new Date(assistant.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
