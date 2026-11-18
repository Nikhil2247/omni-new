'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { DataTable, PageHeader, StatusBadge, type DataColumn } from '@/components/dash'

export default function MarketingPagesContentPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const { data, isLoading } = useBlogPosts({ page: currentPage, limit: 20 })
  type Post = NonNullable<typeof data>['data'][number]

  const columns: DataColumn<Post>[] = [
    { id: 'title', header: 'Title', cell: (p) => <span className="font-medium">{p.title}</span>, exportValue: (p) => p.title },
    { id: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} />, exportValue: (p) => p.status },
    { id: 'updated', header: 'Updated', cell: (p) => formatDate(p.updatedAt), exportValue: (p) => formatDate(p.updatedAt) },
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Pages" />
      <DataTable
        data={data?.data}
        columns={columns}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        rowActions={(p) => [{ label: 'Edit', icon: Pencil, href: `/marketing/content/${p.id}` }]}
        exportFilename="pages"
        emptyTitle="No pages found"
        serverPagination={{
          page: currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? data?.data?.length ?? 0,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
