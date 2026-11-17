'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAdminAudit } from '@/hooks/queries/use-admin'
import { useUmami } from '@/hooks/use-umami'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SystemAuditPage() {
  const { track } = useUmami()
  const [query, setQuery] = useState('')
  const [entityType, setEntityType] = useState('')
  const [userId, setUserId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [query, entityType, userId])

  useEffect(() => {
    track('system:audit:page_view', { section: 'audit_logs' })
  }, [track])

  const params = useMemo(
    () => ({
      action: query.trim() || undefined,
      entityType: entityType.trim() || undefined,
      userId: userId.trim() || undefined,
      page: currentPage,
      limit: 25,
    }),
    [query, entityType, userId, currentPage]
  )

  const { data, isLoading } = useAdminAudit(params)
  const rows = useMemo(() => {
    if (Array.isArray(data?.data)) {
      return data.data
    }
    if (data?.data && typeof data.data === 'object' && 'data' in data.data) {
      const nestedData = (data.data as { data?: unknown }).data
      if (Array.isArray(nestedData)) {
        return nestedData
      }
    }
    return []
  }, [data])

  const paginationMeta = useMemo(() => {
    if (data?.meta && typeof data.meta === 'object' && 'totalPages' in data.meta) {
      return data.meta
    }
    if (data?.data && typeof data.data === 'object' && 'meta' in data.data) {
      const nestedMeta = (data.data as { meta?: unknown }).meta
      if (nestedMeta && typeof nestedMeta === 'object' && 'totalPages' in nestedMeta) {
        return nestedMeta as {
          total: number
          page: number
          limit: number
          totalPages: number
          hasNextPage: boolean
          hasPreviousPage: boolean
        }
      }
    }
    return undefined
  }, [data])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Audit logs</h1>
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
          ) : rows.length ? (
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
                {rows.map((log) => (
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

          {paginationMeta ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {paginationMeta.page} of {paginationMeta.totalPages} • {paginationMeta.total} logs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!paginationMeta.hasPreviousPage || isLoading}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!paginationMeta.hasNextPage || isLoading}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
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
