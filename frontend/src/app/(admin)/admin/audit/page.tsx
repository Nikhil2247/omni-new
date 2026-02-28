'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, FileText } from 'lucide-react'
import { useAdminAudit } from '@/hooks/queries/use-admin'
import { trackDashboard } from '@/lib/analytics/umami'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AdminAuditPage() {
  const [query, setQuery] = useState('')
  const [entityType, setEntityType] = useState('')
  const [userId, setUserId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    trackDashboard.sectionView('admin-audit', 'admin')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, entityType, userId])

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track all administrative changes and system actions</p>
      </div>

      {/* Log table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Audit activity</CardTitle>
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by action"
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
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.entityType}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.userId || 'System'}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No audit logs found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try adjusting your filters to see results.
              </p>
            </div>
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