'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAdminAudit } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SystemAuditPage() {
  const [query, setQuery] = useState('')
  const [entityType, setEntityType] = useState('')
  const [userId, setUserId] = useState('')

  const params = useMemo(
    () => ({
      action: query.trim() || undefined,
      entityType: entityType.trim() || undefined,
      userId: userId.trim() || undefined,
      page: 1,
      limit: 25,
    }),
    [query, entityType, userId]
  )

  const { data, isLoading } = useAdminAudit(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit logs</h1>
        <p className="text-muted-foreground">Trace system actions and changes.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Audit activity</CardTitle>
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Action"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-8"
              />
            </div>
            <Input
              placeholder="Entity type"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            />
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.entityType}</Badge>
                    </TableCell>
                    <TableCell>{log.userId || 'System'}</TableCell>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No audit logs found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
