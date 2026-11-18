'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { Button } from '@/components/ui/button'
import { DataTable, PageHeader, StatusBadge, TwoLineCell, type DataColumn } from '@/components/dash'

export default function ContentWriterDashboardPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const { data, isLoading } = useBlogPosts({ status: 'DRAFT', page: currentPage, limit: 20 })
  type Post = NonNullable<typeof data>['data'][number]

  const columns: DataColumn<Post>[] = [
    {
      id: 'title',
      header: 'Title',
      cell: (p) => <TwoLineCell title={p.title} subtitle={`Updated ${formatDate(p.updatedAt)}`} />,
      exportValue: (p) => p.title,
    },
    { id: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} />, exportValue: (p) => p.status },
  ]

  return (
    <RoleGuard allowedRoles={[ROLES.CONTENT_WRITER]} redirectOnFail={true} exactMatch>
      <div className="space-y-3">
        <PageHeader
          title="Content Writer Dashboard"
          actions={
            <Button asChild size="sm">
              <Link href="/marketing/content/new">Write New Draft</Link>
            </Button>
          }
        />

        <DataTable
          data={data?.data}
          columns={columns}
          rowKey={(p) => p.id}
          isLoading={isLoading}
          rowActions={(p) => [{ label: 'Edit draft', icon: Pencil, href: `/marketing/content/${p.id}` }]}
          emptyTitle="No drafts yet. Start writing your first draft."
          serverPagination={{
            page: currentPage,
            pageSize: 20,
            total: data?.meta?.total ?? data?.data?.length ?? 0,
            onPageChange: setCurrentPage,
          }}
        />
      </div>
    </RoleGuard>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
