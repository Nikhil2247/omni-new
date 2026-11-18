'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { useAdminAudit } from '@/hooks/queries/use-admin'
import { useUmami } from '@/hooks/use-umami'
import { Input } from '@/components/ui/input'
import { DataTable, PageHeader, StatusBadge, type DataColumn } from '@/components/dashboard'

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

  const columns: DataColumn<(typeof rows)[number]>[] = [
    {
      id: 'action',
      header: 'Action',
      label: 'Action',
      cell: (log) => <span className="font-medium">{log.action}</span>,
      exportValue: (log) => log.action,
    },
    {
      id: 'entity',
      header: 'Entity',
      label: 'Entity',
      cell: (log) => <StatusBadge tone="neutral">{log.entityType}</StatusBadge>,
      exportValue: (log) => log.entityType,
    },
    {
      id: 'user',
      header: 'User',
      label: 'User',
      cell: (log) => <span className="text-muted-foreground">{log.userId || 'System'}</span>,
      exportValue: (log) => log.userId || 'System',
    },
    {
      id: 'time',
      header: 'Time',
      label: 'Time',
      cell: (log) => <span className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</span>,
      exportValue: (log) => formatDateTime(log.createdAt),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Audit logs" />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(log) => log.id}
        isLoading={isLoading}
        search={{ value: query, onChange: setQuery, placeholder: 'Action' }}
        filters={
          <>
            <Input
              placeholder="Entity type"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              className="h-8 w-36"
            />
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="h-8 w-36"
            />
          </>
        }
        serverPagination={{
          page: paginationMeta?.page ?? currentPage,
          pageSize: 25,
          total: paginationMeta?.total ?? rows.length,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No audit logs found"
        emptyIcon={FileText}
        exportFilename="system-audit-logs"
      />
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
